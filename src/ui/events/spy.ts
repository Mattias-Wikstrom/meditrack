#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { createClient } from 'graphql-ws';
import { WebSocket } from 'ws';
import { readToken } from '../cli/auth/tokenStore';

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

const COLOR: Record<EventName, string> = {
  orderDraftCreated: '\x1b[32m',
  orderDraftUpdated: '\x1b[34m',
  orderStatusChanged: '\x1b[33m',
  stockBelowThreshold: '\x1b[31m',
  productRestocked: '\x1b[36m',
  medicinalProductUpdated: '\x1b[35m',
};

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

function ts(): string {
  return new Date().toISOString();
}

function printEvent(name: EventName, data: unknown, compact: boolean): void {
  const color = COLOR[name];
  process.stdout.write(`${DIM}[${ts()}]${RESET} ${color}${BOLD}${name}${RESET}\n`);
  process.stdout.write(compact ? JSON.stringify(data) : JSON.stringify(data, null, 2));
  process.stdout.write('\n\n');
}

interface ProgramOptions {
  url: string;
  events?: string[];
  token?: string;
  compact: boolean;
}

const program = new Command();

program
  .name('events-spy')
  .description(
    [
      'Subscribe to live server events via GraphQL subscriptions over WebSocket.',
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
  .action(async (opts: ProgramOptions) => {
    const token = opts.token ?? readToken();
    if (!token) {
      console.error('Not authenticated. Run: npm run mt-cli -- login --actor-id <id> --password <password>');
      process.exit(1);
    }

    const requested: EventName[] = opts.events
      ? (opts.events as EventName[])
      : ALL_EVENTS;

    const unknown = requested.filter((e) => !ALL_EVENTS.includes(e));
    if (unknown.length > 0) {
      console.error(`Unknown events: ${unknown.join(', ')}`);
      console.error(`Available: ${ALL_EVENTS.join(', ')}`);
      process.exit(1);
    }

    console.log(`Connecting to ${opts.url} …`);
    console.log(`Watching: ${requested.join(', ')}\n`);

    const client = createClient({
      url: opts.url,
      webSocketImpl: WebSocket as unknown as typeof globalThis.WebSocket,
      connectionParams: { token },
      // Retry indefinitely on network errors (e.g. server still starting).
      // Fail fast on auth close events (those have a numeric close code).
      retryAttempts: Infinity,
      shouldRetry: (err: unknown) => {
        const code = (err as Record<string, unknown>)['code'];
        return typeof code !== 'number';
      },
    });

    const disposers: Array<() => void> = [];

    for (const eventName of requested) {
      const query = SUBSCRIPTIONS[eventName];
      const dispose = client.subscribe(
        { query },
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
            printEvent(eventName, data, opts.compact);
          },
          error: (err: unknown) => {
            if (err instanceof Error) {
              console.error(`[${eventName}] error: ${err.message}`);
            } else if (Array.isArray(err)) {
              const msgs = (err as Array<{ message?: string }>).map((e) => e.message ?? JSON.stringify(e));
              console.error(`[${eventName}] GraphQL error: ${msgs.join(' | ')}`);
            } else {
              const e = err as Record<string, unknown>;
              // ws wraps network errors in an ErrorEvent; the real Error is in .error
              const underlying = e['error'];
              if (underlying instanceof Error) {
                console.error(`[${eventName}] connection error: ${underlying.message}`);
                return;
              }
              const code = e['code'] as number | undefined;
              const raw = e['reason'];
              const reason = Buffer.isBuffer(raw) ? raw.toString() : String(raw ?? '');
              if (code === 4403) {
                console.error(`[${eventName}] The server rejected your session token. Try logging in again:`);
                console.error('  npm run mt-cli -- login --actor-id <id> --password <password>');
                cleanup();
                process.exit(1);
              }
              const detail = reason ? `: ${reason}` : '';
              if (code === 4400 || code === 4401 || code === 4500) {
                console.error(`[${eventName}] Connection rejected (${String(code)})${detail}`);
                cleanup();
                process.exit(1);
              } else {
                console.error(`[${eventName}] connection closed (code ${String(code)})${detail}`);
              }
            }
          },
          complete: () => {
            console.log(`[${eventName}] subscription ended`);
          },
        },
      );
      disposers.push(dispose);
    }

    const keepAlive = setInterval(() => undefined, 30_000);

    const cleanup = (): void => {
      clearInterval(keepAlive);
      disposers.forEach((d) => d());
      void client.dispose();
    };

    process.on('SIGINT', () => {
      process.stdout.write('\n');
      cleanup();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      cleanup();
      process.exit(0);
    });

    await new Promise<never>(() => undefined);
  });

program.parseAsync().catch((err: unknown) => {
  console.error('Error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
