#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { createClient, Client } from 'graphql-ws';
import { WebSocket } from 'ws';
import { readToken } from '../mt-cli/auth/tokenStore';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

function ts(): string {
  return new Date().toISOString();
}

function makeClient(url: string, token: string): Client {
  return createClient({
    url,
    webSocketImpl: WebSocket as unknown as typeof globalThis.WebSocket,
    connectionParams: { token },
    retryAttempts: Infinity,
    shouldRetry: (err: unknown) => {
      const code = (err as Record<string, unknown>)['code'];
      return typeof code !== 'number';
    },
  });
}

function handleWsError(err: unknown, label: string, cleanup: () => void): void {
  if (err instanceof Error) {
    console.error(`[${label}] error: ${err.message}`);
    return;
  }
  if (Array.isArray(err)) {
    const msgs = (err as Array<{ message?: string }>).map((e) => e.message ?? JSON.stringify(e));
    console.error(`[${label}] GraphQL error: ${msgs.join(' | ')}`);
    return;
  }
  const e = err as Record<string, unknown>;
  const underlying = e['error'];
  if (underlying instanceof Error) {
    console.error(`[${label}] connection error: ${underlying.message}`);
    return;
  }
  const code = e['code'] as number | undefined;
  const raw = e['reason'];
  const reason = Buffer.isBuffer(raw) ? raw.toString() : String(raw ?? '');
  const detail = reason ? `: ${reason}` : '';
  if (code === 4403) {
    console.error(`[${label}] The server rejected your session token. Try logging in again:`);
    console.error('  npm run mt-cli -- login --actor-id <id> --password <password>');
    cleanup();
    process.exit(1);
  }
  if (code === 4400 || code === 4401 || code === 4500) {
    console.error(`[${label}] Connection rejected (${String(code)})${detail}`);
    cleanup();
    process.exit(1);
  }
  console.error(`[${label}] connection closed (code ${String(code)})${detail}`);
}

// ---------------------------------------------------------------------------
// domain subcommand
// ---------------------------------------------------------------------------

const SUBSCRIPTIONS = {
  orderDraftCreated: `subscription { orderDraftCreated { orderId wardUnitId actorId } }`,
  orderDraftUpdated: `subscription { orderDraftUpdated { orderId actorId } }`,
  orderStatusChanged: `subscription { orderStatusChanged { orderId from to actorId } }`,
  stockBelowThreshold: `subscription { stockBelowThreshold { medicinalProductId productName medicationId stockLevel stockThreshold } }`,
  productRestocked: `subscription { productRestocked { medicinalProductId productName stockLevel } }`,
  medicinalProductUpdated: `subscription { medicinalProductUpdated { id productName medicationId stockLevel stockThreshold isBelowThreshold } }`,
} as const;

type EventName = keyof typeof SUBSCRIPTIONS;
const ALL_EVENTS = Object.keys(SUBSCRIPTIONS) as EventName[];

const EVENT_COLOR: Record<EventName, string> = {
  orderDraftCreated: '\x1b[32m',
  orderDraftUpdated: '\x1b[34m',
  orderStatusChanged: '\x1b[33m',
  stockBelowThreshold: '\x1b[31m',
  productRestocked: '\x1b[36m',
  medicinalProductUpdated: '\x1b[35m',
};

// ---------------------------------------------------------------------------
// repos subcommand
// ---------------------------------------------------------------------------

const REPO_QUERY = `subscription { repositoryChanged { entityType kind entityId } }`;

const KIND_COLOR: Record<string, string> = {
  saved: '\x1b[32m',
  deleted: '\x1b[31m',
};

interface ChangeEvent {
  entityType: string;
  kind: string;
  entityId: string;
}

// ---------------------------------------------------------------------------
// program
// ---------------------------------------------------------------------------

const program = new Command();
program.name('event-watcher').description('Watch live server events over WebSocket.');

program
  .command('domain')
  .description(
    [
      'Subscribe to domain events via GraphQL subscriptions.',
      '',
      'Available events:',
      ...ALL_EVENTS.map((e) => `  ${e}`),
    ].join('\n'),
  )
  .option('-u, --url <url>', 'WebSocket server URL', 'ws://localhost:4000/graphql')
  .option(
    '-e, --events <list>',
    'comma-separated events to watch (default: all)',
    (v: string): string[] => v.split(',').map((s) => s.trim()),
  )
  .option('--token <token>', 'JWT token (overrides stored session)')
  .option('--compact', 'print events as single-line JSON', false)
  .action(async (opts: { url: string; events?: string[]; token?: string; compact: boolean }) => {
    const token = opts.token ?? readToken();
    if (!token) {
      console.error('Not authenticated. Run: npm run mt-cli -- login --actor-id <id> --password <password>');
      process.exit(1);
    }

    const requested: EventName[] = opts.events ? (opts.events as EventName[]) : ALL_EVENTS;
    const unknown = requested.filter((e) => !ALL_EVENTS.includes(e));
    if (unknown.length > 0) {
      console.error(`Unknown events: ${unknown.join(', ')}`);
      console.error(`Available: ${ALL_EVENTS.join(', ')}`);
      process.exit(1);
    }

    console.log(`Connecting to ${opts.url} …`);
    console.log(`Watching: ${requested.join(', ')}\n`);

    const client = makeClient(opts.url, token);
    const disposers: Array<() => void> = [];
    let keepAlive: ReturnType<typeof setInterval>;

    const cleanup = (): void => {
      clearInterval(keepAlive);
      disposers.forEach((d) => d());
      void client.dispose();
    };

    for (const eventName of requested) {
      const dispose = client.subscribe(
        { query: SUBSCRIPTIONS[eventName] },
        {
          next: (result) => {
            if (result.errors) {
              console.error(`[${eventName}] GraphQL errors:`, JSON.stringify(result.errors));
              return;
            }
            const data =
              result.data !== null && result.data !== undefined
                ? (result.data as Record<string, unknown>)[eventName]
                : undefined;
            const color = EVENT_COLOR[eventName];
            process.stdout.write(`${DIM}[${ts()}]${RESET} ${color}${BOLD}${eventName}${RESET}\n`);
            process.stdout.write(opts.compact ? JSON.stringify(data) : JSON.stringify(data, null, 2));
            process.stdout.write('\n\n');
          },
          error: (err) => handleWsError(err, eventName, cleanup),
          complete: () => console.log(`[${eventName}] subscription ended`),
        },
      );
      disposers.push(dispose);
    }

    keepAlive = setInterval(() => undefined, 30_000);

    process.on('SIGINT', () => { process.stdout.write('\n'); cleanup(); process.exit(0); });
    process.on('SIGTERM', () => { cleanup(); process.exit(0); });
    await new Promise<never>(() => undefined);
  });

program
  .command('repos')
  .description('Watch repository save/delete events in real time.')
  .option('-u, --url <url>', 'WebSocket server URL', 'ws://localhost:4000/graphql')
  .option(
    '-e, --entity <list>',
    'comma-separated entity types to filter (default: all)',
    (v: string): string[] => v.split(',').map((s) => s.trim()),
  )
  .option('--token <token>', 'JWT token (overrides stored session)')
  .option('--compact', 'print events as single-line JSON', false)
  .action(async (opts: { url: string; entity?: string[]; token?: string; compact: boolean }) => {
    const token = opts.token ?? readToken();
    if (!token) {
      console.error('Not authenticated. Run: npm run mt-cli -- login --actor-id <id> --password <password>');
      process.exit(1);
    }

    const filter = opts.entity ? new Set(opts.entity) : null;
    const filterNote = filter ? ` (filtering: ${[...filter].join(', ')})` : '';
    console.log(`Connecting to ${opts.url} …`);
    console.log(`Watching repository changes${filterNote}\n`);

    const client = makeClient(opts.url, token);
    let keepAlive: ReturnType<typeof setInterval>;

    const cleanup = (): void => {
      clearInterval(keepAlive);
      dispose();
      void client.dispose();
    };

    const dispose = client.subscribe(
      { query: REPO_QUERY },
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
          const line = opts.compact ? JSON.stringify(change) : JSON.stringify(change, null, 2);
          process.stdout.write(
            `${DIM}[${ts()}]${RESET} ${color}${BOLD}${change.kind}${RESET} ${change.entityType} ${DIM}${change.entityId}${RESET}\n${line}\n\n`,
          );
        },
        error: (err) => handleWsError(err, 'repositoryChanged', cleanup),
        complete: () => console.log('subscription ended'),
      },
    );

    keepAlive = setInterval(() => undefined, 30_000);

    process.on('SIGINT', () => { process.stdout.write('\n'); cleanup(); process.exit(0); });
    process.on('SIGTERM', () => { cleanup(); process.exit(0); });
    await new Promise<never>(() => undefined);
  });

program.parseAsync().catch((err: unknown) => {
  console.error('Error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
