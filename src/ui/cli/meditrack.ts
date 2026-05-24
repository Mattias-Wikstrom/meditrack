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
import { ConsoleOutput } from './ConsoleOutput';
import { listMedications, showMedication } from './commands/medications';
import { listOrders, createOrder, sendOrder, confirmOrder, deliverOrder } from './commands/orders';
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

// --- Commands ---
const program = new Command();
program.name('meditrack').description('Medication tracking CLI');

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
  .requiredOption('--actor-id <id>', 'actor ID')
  .requiredOption('--ward-unit-id <id>', 'ward unit ID')
  .requiredOption('--medication-id <id>', 'medication ID')
  .requiredOption('--quantity <n>', 'quantity', parseInt)
  .action(async (opts) => createOrder(createOrderUseCase, output, opts.actorId, opts.wardUnitId, opts.medicationId, opts.quantity));

orders
  .command('send <orderId>')
  .description('Send a draft order to the pharmacy')
  .requiredOption('--actor-id <id>', 'actor ID')
  .action(async (orderId, opts) => sendOrder(sendOrderUseCase, output, opts.actorId, orderId));

orders
  .command('confirm <orderId>')
  .description('Confirm receipt of a sent order')
  .requiredOption('--actor-id <id>', 'actor ID')
  .action(async (orderId, opts) => confirmOrder(confirmOrderUseCase, output, opts.actorId, orderId));

orders
  .command('deliver <orderId>')
  .description('Mark an order as delivered and update stock')
  .requiredOption('--actor-id <id>', 'actor ID')
  .option(
    '--product <spec>',
    'medicationId:medicinalProductId:quantity — repeat once per product used',
    (val: string, prev: string[]) => [...prev, val],
    [] as string[],
  )
  .action(async (orderId, opts) => {
    const productSelections = (opts.product as string[]).map((spec) => {
      const [medicationId, medicinalProductId, quantityStr] = spec.split(':');
      return {
        medicationId: medicationId ?? '',
        medicinalProductId: medicinalProductId ?? '',
        quantity: parseInt(quantityStr ?? '0', 10),
      };
    });
    return deliverOrder(deliverOrderUseCase, output, opts.actorId, orderId, productSelections);
  });

program
  .command('graphql <query>')
  .description('Execute a GraphQL query or mutation in-process')
  .option('--actor-id <id>', 'actor ID (required for mutations)', '')
  .option('--variables <json>', 'variables as a JSON object')
  .action(async (query: string, opts: { actorId: string; variables?: string }) => {
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
      actorId: opts.actorId,
    };
    await runGraphQL(context, output, query, variables);
  });

program.parseAsync().catch((err: unknown) => {
  output.error(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  output.exit(1);
});
