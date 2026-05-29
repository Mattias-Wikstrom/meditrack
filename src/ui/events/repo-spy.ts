#!/usr/bin/env node
import { Command } from 'commander';
import { createClient } from 'graphql-ws';
import { WebSocket } from 'ws';
import { readToken } from '../cli/auth/tokenStore';

const QUERY = `subscription { repositoryChanged { entityType kind entityId } }`;

const KIND_COLOR: Record<string, string> = {
  saved: '\x1b[32m',
  deleted: '\x1b[31m',
};

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

function ts(): string {
  return new Date().toISOString();
}

interface ChangeEvent {
  entityType: string;
  kind: string;
  entityId: string;
}

interface ProgramOptions {
  url: string;
  token?: string;
  entity?: string[];
  compact: boolean;
}

const program = new Command();

program
  .name('repo-spy')
  .description('Watch repository save/delete events in real time.')
  .option('-u, --url <url>', 'WebSocket server URL', 'ws://localhost:4000/graphql')
  .option(
    '-e, --entity <list>',
    'comma-separated entity types to filter (default: all)',
    (v: string): string[] => v.split(',').map((s) => s.trim()),
  )
  .option('--token <token>', 'JWT token (overrides stored session)')
  .option('--compact', 'print events as single-line JSON', false)
  .action(async (opts: ProgramOptions) => {
    const token = opts.token ?? readToken();
    if (!token) {
      console.error('Not authenticated. Run: npm run mt-cli -- login --actor-id <id> --password <password>');
      process.exit(1);
    }

    const filter = opts.entity ? new Set(opts.entity) : null;
    const filterNote = filter ? ` (filtering: ${[...filter].join(', ')})` : '';
    console.log(`Connecting to ${opts.url} …`);
    console.log(`Watching repository changes${filterNote}\n`);

    const client = createClient({
      url: opts.url,
      webSocketImpl: WebSocket as unknown as typeof globalThis.WebSocket,
      connectionParams: { token },
      retryAttempts: Infinity,
      shouldRetry: (err: unknown) => {
        const code = (err as Record<string, unknown>)['code'];
        return typeof code !== 'number';
      },
    });

    const dispose = client.subscribe(
      { query: QUERY },
      {
        next: (result) => {
          if (result.errors) {
            console.error('GraphQL errors:', JSON.stringify(result.errors));
            return;
          }
          const change = (result.data as Record<string, ChangeEvent> | null)?.repositoryChanged;
          if (!change) return;
          if (filter && !filter.has(change.entityType)) return;

          const color = KIND_COLOR[change.kind] ?? '';
          const line = opts.compact
            ? JSON.stringify(change)
            : `${JSON.stringify(change, null, 2)}`;
          process.stdout.write(
            `${DIM}[${ts()}]${RESET} ${color}${BOLD}${change.kind}${RESET} ${change.entityType} ${DIM}${change.entityId}${RESET}\n${line}\n\n`,
          );
        },
        error: (err: unknown) => {
          if (err instanceof Error) {
            console.error(`error: ${err.message}`);
          } else if (Array.isArray(err)) {
            const msgs = (err as Array<{ message?: string }>).map((e) => e.message ?? JSON.stringify(e));
            console.error(`GraphQL error: ${msgs.join(' | ')}`);
          } else {
            const e = err as Record<string, unknown>;
            const underlying = e['error'];
            if (underlying instanceof Error) {
              console.error(`connection error: ${underlying.message}`);
              return;
            }
            const code = e['code'] as number | undefined;
            const raw = e['reason'];
            const reason = Buffer.isBuffer(raw) ? raw.toString() : String(raw ?? '');
            if (code === 4400 || code === 4401 || code === 4403 || code === 4500) {
              console.error('auth rejected — re-run: npm run mt-cli -- login');
            } else {
              console.error(`connection closed (code ${String(code)}): ${reason}`);
            }
          }
        },
        complete: () => console.log('subscription ended'),
      },
    );

    const keepAlive = setInterval(() => undefined, 30_000);

    const cleanup = (): void => {
      clearInterval(keepAlive);
      dispose();
      void client.dispose();
    };

    process.on('SIGINT', () => { process.stdout.write('\n'); cleanup(); process.exit(0); });
    process.on('SIGTERM', () => { cleanup(); process.exit(0); });

    await new Promise<never>(() => undefined);
  });

program.parseAsync().catch((err: unknown) => {
  console.error('Error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
