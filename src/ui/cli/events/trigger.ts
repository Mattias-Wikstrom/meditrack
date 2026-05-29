#!/usr/bin/env node
/**
 * Events are emitted as side effects of real business operations.
 * This tool is a thin CLI wrapper over the REST API that makes it easy
 * to trigger specific events for debugging — no special server mode needed.
 *
 * Event → action mapping:
 *   orderDraftCreated        ← create-order
 *   orderDraftUpdated        ← update-order
 *   orderStatusChanged       ← send-order / confirm-order / deliver-order
 *   productRestocked         ← restock  (always emitted)
 *   stockBelowThreshold      ← restock  (only if stock stays below threshold after restock)
 *                               deliver-order (only if delivery drops stock below threshold)
 *   medicinalProductUpdated  ← update-product
 */
import 'dotenv/config';
import { Command } from 'commander';
import { readToken } from '../mt-cli/auth/tokenStore';

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  return process.env['MEDITRACK_API_URL'] ?? 'http://localhost:4000/api';
}

function getToken(explicitToken?: string): string {
  const token = explicitToken ?? readToken();
  if (!token) {
    console.error('Not authenticated. Run: npm run mt-cli -- login --actor-id <id> --password <password>');
    process.exit(1);
  }
  return token;
}

interface RequestOptions {
  token: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: Record<string, unknown>;
}

async function request({ token, method, path, body }: RequestOptions): Promise<void> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    const detail = typeof data === 'object' && data !== null ? JSON.stringify(data) : String(data);
    console.error(`HTTP ${res.status} from ${method} ${url}`);
    console.error(detail);
    process.exit(1);
  }

  console.log(JSON.stringify(data, null, 2));
}

// ---------------------------------------------------------------------------
// Program
// ---------------------------------------------------------------------------

interface GlobalOpts {
  token?: string;
}

const program = new Command();

program
  .name('events-trigger')
  .description(
    [
      'Trigger server events by performing real business operations via the REST API.',
      '',
      'Events are always emitted as side effects — not injected directly.',
      'Set MEDITRACK_API_URL to override the default http://localhost:4000/api.',
    ].join('\n'),
  )
  .option('--token <token>', 'JWT token (overrides stored session)');

// ---------------------------------------------------------------------------
// create-order  →  emits: orderDraftCreated
// ---------------------------------------------------------------------------
program
  .command('create-order')
  .description('Create a draft order  →  emits orderDraftCreated')
  .requiredOption('--medication-id <id>', 'medication ID')
  .requiredOption('--quantity <n>', 'quantity', parseInt)
  .action(async (opts: { medicationId: string; quantity: number }, cmd) => {
    const token = getToken((cmd.optsWithGlobals() as GlobalOpts).token);
    await request({
      token,
      method: 'POST',
      path: '/orders',
      body: { lines: [{ medicationId: opts.medicationId, quantity: opts.quantity }] },
    });
  });

// ---------------------------------------------------------------------------
// update-order  →  emits: orderDraftUpdated
// ---------------------------------------------------------------------------
program
  .command('update-order')
  .description('Update a draft order\'s lines  →  emits orderDraftUpdated')
  .requiredOption('--order-id <id>', 'order ID')
  .requiredOption('--medication-id <id>', 'medication ID')
  .requiredOption('--quantity <n>', 'quantity', parseInt)
  .action(async (opts: { orderId: string; medicationId: string; quantity: number }, cmd) => {
    const token = getToken((cmd.optsWithGlobals() as GlobalOpts).token);
    await request({
      token,
      method: 'POST',
      path: `/orders/${opts.orderId}/lines`,
      body: { lines: [{ medicationId: opts.medicationId, quantity: opts.quantity }] },
    });
  });

// ---------------------------------------------------------------------------
// send-order  →  emits: orderStatusChanged (Draft → Sent)
// ---------------------------------------------------------------------------
program
  .command('send-order')
  .description('Send a draft order to the pharmacy  →  emits orderStatusChanged (Draft→Sent)')
  .requiredOption('--order-id <id>', 'order ID')
  .action(async (opts: { orderId: string }, cmd) => {
    const token = getToken((cmd.optsWithGlobals() as GlobalOpts).token);
    await request({ token, method: 'POST', path: `/orders/${opts.orderId}/send` });
  });

// ---------------------------------------------------------------------------
// confirm-order  →  emits: orderStatusChanged (Sent → Confirmed)
// ---------------------------------------------------------------------------
program
  .command('confirm-order')
  .description('Confirm receipt of a sent order  →  emits orderStatusChanged (Sent→Confirmed)')
  .requiredOption('--order-id <id>', 'order ID')
  .action(async (opts: { orderId: string }, cmd) => {
    const token = getToken((cmd.optsWithGlobals() as GlobalOpts).token);
    await request({ token, method: 'POST', path: `/orders/${opts.orderId}/confirm` });
  });

// ---------------------------------------------------------------------------
// deliver-order  →  emits: orderStatusChanged (Confirmed → Delivered)
//                           stockBelowThreshold (if stock drops below threshold)
// ---------------------------------------------------------------------------
program
  .command('deliver-order')
  .description(
    [
      'Mark an order as delivered and deduct stock',
      '  →  emits orderStatusChanged (Confirmed→Delivered)',
      '  →  emits stockBelowThreshold (if delivery drops stock below threshold)',
      '',
      'Repeat --product for each product used:',
      '  --product <medicationId:medicinalProductId:quantity>',
    ].join('\n'),
  )
  .requiredOption('--order-id <id>', 'order ID')
  .option(
    '--product <spec>',
    'medicationId:medicinalProductId:quantity  (repeat for each product)',
    (val: string, prev: string[]) => [...prev, val],
    [] as string[],
  )
  .action(async (opts: { orderId: string; product: string[] }, cmd) => {
    const token = getToken((cmd.optsWithGlobals() as GlobalOpts).token);
    const productSelections = opts.product.map((spec) => {
      const parts = spec.split(':');
      return {
        medicationId: parts[0] ?? '',
        medicinalProductId: parts[1] ?? '',
        quantity: parseInt(parts[2] ?? '0', 10),
      };
    });
    await request({
      token,
      method: 'POST',
      path: `/orders/${opts.orderId}/deliver`,
      body: { productSelections },
    });
  });

// ---------------------------------------------------------------------------
// restock  →  emits: productRestocked (always)
//                     stockBelowThreshold (if stock remains below threshold after restock)
// ---------------------------------------------------------------------------
program
  .command('restock')
  .description(
    [
      'Add stock to a medicinal product',
      '  →  emits productRestocked',
      '  →  emits stockBelowThreshold (if stock is still below threshold after restock)',
    ].join('\n'),
  )
  .requiredOption('--product-id <id>', 'medicinal product ID')
  .requiredOption('--quantity <n>', 'units to add', parseInt)
  .action(async (opts: { productId: string; quantity: number }, cmd) => {
    const token = getToken((cmd.optsWithGlobals() as GlobalOpts).token);
    await request({
      token,
      method: 'POST',
      path: `/products/${opts.productId}/restock`,
      body: { quantity: opts.quantity },
    });
  });

// ---------------------------------------------------------------------------
// update-product  →  emits: medicinalProductUpdated
// ---------------------------------------------------------------------------
program
  .command('update-product')
  .description('Update a medicinal product\'s name or threshold  →  emits medicinalProductUpdated')
  .requiredOption('--product-id <id>', 'medicinal product ID')
  .option('--product-name <name>', 'new product name')
  .option('--stock-threshold <n>', 'new low-stock threshold', parseInt)
  .action(
    async (opts: { productId: string; productName?: string; stockThreshold?: number }, cmd) => {
      const token = getToken((cmd.optsWithGlobals() as GlobalOpts).token);
      const body: Record<string, unknown> = {};
      if (opts.productName !== undefined) body['productName'] = opts.productName;
      if (opts.stockThreshold !== undefined) body['stockThreshold'] = opts.stockThreshold;
      if (Object.keys(body).length === 0) {
        console.error('Provide at least one of --product-name or --stock-threshold');
        process.exit(1);
      }
      await request({ token, method: 'PATCH', path: `/products/${opts.productId}`, body });
    },
  );

program.parseAsync().catch((err: unknown) => {
  console.error('Error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
