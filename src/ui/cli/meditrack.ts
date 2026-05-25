#!/usr/bin/env node
import { Command } from 'commander';
import { prisma } from '../../storage/prisma/prismaClient';
import { PrismaMedicationRepository } from '../../storage/prisma/PrismaMedicationRepository';
import { PrismaMedicinalProductRepository } from '../../storage/prisma/PrismaMedicinalProductRepository';
import { PrismaOrderRepository } from '../../storage/prisma/PrismaOrderRepository';
import { PrismaWardUnitRepository } from '../../storage/prisma/PrismaWardUnitRepository';
import { PrismaActorRepository } from '../../storage/prisma/PrismaActorRepository';
import { PrismaTransactor } from '../../storage/prisma/PrismaTransactor';
import { SimpleEventBus } from '../../eventBus/SimpleEventBus';
import { CreateOrderUseCase } from '../../domain/order/useCases/ordering/CreateOrderUseCase';
import { SendOrderUseCase } from '../../domain/order/useCases/fulfillment/SendOrderUseCase';
import { ConfirmOrderUseCase } from '../../domain/order/useCases/fulfillment/ConfirmOrderUseCase';
import { DeliverOrderUseCase } from '../../domain/order/useCases/fulfillment/DeliverOrderUseCase';
import { verifyToken } from '../../domain/auth/jwt';
import { readToken } from './auth/tokenStore';
import { ConsoleOutput } from './ConsoleOutput';
import { listMedications, showMedication } from './commands/medications';
import { listOrders, createOrder, sendOrder, confirmOrder, deliverOrder } from './commands/orders';
import { login } from './commands/auth';
import { passwd } from './commands/passwd';
import { runGraphQL } from './commands/graphql';
import { GraphQLContext } from '../../api/graphql/context';

// --- Wiring ---
const medicationRepo = new PrismaMedicationRepository(prisma);
const medicinalProductRepo = new PrismaMedicinalProductRepository(prisma);
const orderRepo = new PrismaOrderRepository(prisma);
const wardUnitRepo = new PrismaWardUnitRepository(prisma);
const actorRepo = new PrismaActorRepository(prisma);
const transactor = new PrismaTransactor(prisma);
const eventBus = new SimpleEventBus();

const createOrderUseCase = new CreateOrderUseCase(actorRepo, transactor, eventBus);
const sendOrderUseCase = new SendOrderUseCase(actorRepo, orderRepo, transactor, eventBus);
const confirmOrderUseCase = new ConfirmOrderUseCase(actorRepo, orderRepo, transactor, eventBus);
const deliverOrderUseCase = new DeliverOrderUseCase(actorRepo, orderRepo, medicinalProductRepo, transactor, eventBus);

const output = new ConsoleOutput();

async function requireActorId(): Promise<string> {
  const token = readToken();
  if (!token) {
    output.error('Not logged in. Run: meditrack login --actor-id <id> --password <password>');
    process.exit(1);
  }
  try {
    const { actorId } = await verifyToken(token);
    return actorId;
  } catch {
    output.error('Session expired. Run: meditrack login --actor-id <id> --password <password>');
    process.exit(1);
  }
}

// --- Commands ---
const program = new Command();
program.name('meditrack').description('Medication tracking CLI');

program
  .command('login')
  .description('Log in and store a session token')
  .requiredOption('--actor-id <id>', 'actor ID')
  .requiredOption('--password <password>', 'password')
  .action(async (opts) => login(prisma, output, opts.actorId, opts.password));

program
  .command('passwd')
  .description('Set the password for an actor')
  .requiredOption('--actor-id <id>', 'actor ID')
  .action(async (opts) => passwd(prisma, output, opts.actorId));

const medications = program.command('medications');

medications
  .command('list')
  .description('List all medications, optionally filtered by a search query')
  .option('-q, --query <query>', 'search by INN name, ATC code, or form')
  .action(async (opts) => listMedications(medicationRepo, output, opts.query));

medications
  .command('show <id>')
  .description('Show a medication and its registered medicinal products')
  .action(async (id) => showMedication(medicationRepo, medicinalProductRepo, output, id));

const orders = program.command('orders');

orders
  .command('list')
  .description('List all orders')
  .action(async () => listOrders(orderRepo, output));

orders
  .command('create')
  .description('Create a new order')
  .requiredOption('--ward-unit-id <id>', 'ward unit ID')
  .requiredOption('--medication-id <id>', 'medication ID')
  .requiredOption('--quantity <n>', 'quantity', parseInt)
  .action(async (opts) => {
    const actorId = await requireActorId();
    return createOrder(createOrderUseCase, output, actorId, opts.wardUnitId, opts.medicationId, opts.quantity);
  });

orders
  .command('send <orderId>')
  .description('Send a draft order to the pharmacy')
  .action(async (orderId) => {
    const actorId = await requireActorId();
    return sendOrder(sendOrderUseCase, output, actorId, orderId);
  });

orders
  .command('confirm <orderId>')
  .description('Confirm receipt of a sent order')
  .action(async (orderId) => {
    const actorId = await requireActorId();
    return confirmOrder(confirmOrderUseCase, output, actorId, orderId);
  });

orders
  .command('deliver <orderId>')
  .description('Mark an order as delivered and update stock')
  .option(
    '--product <spec>',
    'medicationId:medicinalProductId:quantity — repeat once per product used',
    (val: string, prev: string[]) => [...prev, val],
    [] as string[],
  )
  .action(async (orderId, opts) => {
    const actorId = await requireActorId();
    const productSelections = (opts.product as string[]).map((spec) => {
      const [medicationId, medicinalProductId, quantityStr] = spec.split(':');
      return {
        medicationId: medicationId ?? '',
        medicinalProductId: medicinalProductId ?? '',
        quantity: parseInt(quantityStr ?? '0', 10),
      };
    });
    return deliverOrder(deliverOrderUseCase, output, actorId, orderId, productSelections);
  });

program
  .command('graphql <query>')
  .description('Execute a GraphQL query or mutation in-process')
  .option('--variables <json>', 'variables as a JSON object')
  .action(async (query: string, opts: { variables?: string }) => {
    const actorId = await requireActorId();
    let variables: Record<string, unknown> | undefined;
    if (opts.variables) {
      try {
        variables = JSON.parse(opts.variables) as Record<string, unknown>;
      } catch {
        output.error('--variables must be valid JSON');
        output.exit(1);
      }
    }
    const context: GraphQLContext = {
      medicationRepo,
      medicinalProductRepo,
      orderRepo,
      wardUnitRepo,
      createOrderUseCase,
      sendOrderUseCase,
      confirmOrderUseCase,
      deliverOrderUseCase,
      actorId,
    };
    await runGraphQL(context, output, query, variables);
  });

program.parseAsync().catch((err: unknown) => {
  output.error(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  output.exit(1);
});
