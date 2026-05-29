#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { prisma } from '../../storage/prisma/prismaClient';
import { PrismaMedicationRepository } from '../../storage/prisma/PrismaMedicationRepository';
import { PrismaMedicinalProductRepository } from '../../storage/prisma/PrismaMedicinalProductRepository';
import { PrismaOrderRepository } from '../../storage/prisma/PrismaOrderRepository';
import { PrismaWardUnitRepository } from '../../storage/prisma/PrismaWardUnitRepository';
import { PrismaActorRepository } from '../../storage/prisma/PrismaActorRepository';
import { PrismaAuditRepository } from '../../storage/prisma/PrismaAuditRepository';
import { PrismaCredentialsRepository } from '../../storage/prisma/PrismaCredentialsRepository';
import { PrismaTransactor } from '../../storage/prisma/PrismaTransactor';
import { SimpleEventBus } from '../../eventBus/SimpleEventBus';
import { CreateActorUseCase } from '../../domain/actor/useCases/CreateActorUseCase';
import { DeleteActorUseCase } from '../../domain/actor/useCases/DeleteActorUseCase';
import { CreateWardUnitUseCase } from '../../domain/wardUnit/useCases/CreateWardUnitUseCase';
import { UpdateWardUnitUseCase } from '../../domain/wardUnit/useCases/UpdateWardUnitUseCase';
import { DeleteWardUnitUseCase } from '../../domain/wardUnit/useCases/DeleteWardUnitUseCase';
import { CreateOrderUseCase } from '../../domain/order/useCases/ordering/CreateOrderUseCase';
import { UpdateOrderLinesUseCase } from '../../domain/order/useCases/ordering/UpdateOrderLinesUseCase';
import { SendOrderUseCase } from '../../domain/order/useCases/fulfillment/SendOrderUseCase';
import { ConfirmOrderUseCase } from '../../domain/order/useCases/fulfillment/ConfirmOrderUseCase';
import { DeliverOrderUseCase } from '../../domain/order/useCases/fulfillment/DeliverOrderUseCase';
import { RestockUseCase } from '../../domain/medication/useCases/RestockUseCase';
import { CreateMedicationUseCase } from '../../domain/medication/useCases/CreateMedicationUseCase';
import { UpdateMedicationUseCase } from '../../domain/medication/useCases/UpdateMedicationUseCase';
import { DeleteMedicationUseCase } from '../../domain/medication/useCases/DeleteMedicationUseCase';
import { CreateMedicinalProductUseCase } from '../../domain/medication/useCases/CreateMedicinalProductUseCase';
import { UpdateMedicinalProductUseCase } from '../../domain/medication/useCases/UpdateMedicinalProductUseCase';
import { DeleteMedicinalProductUseCase } from '../../domain/medication/useCases/DeleteMedicinalProductUseCase';
import { verifyToken } from '../../domain/auth/jwt';
import { readToken } from './auth/tokenStore';
import { ConsoleOutput } from './ConsoleOutput';
import { listActors, createActor, deleteActor, bootstrapCreateActor } from './commands/actors';
import { listWardUnits, createWardUnit, updateWardUnit, deleteWardUnit } from './commands/wardUnits';
import { listAudit } from './commands/audit';
import {
  listMedications,
  showMedication,
  createMedication,
  updateMedication,
  deleteMedication,
  addProduct,
  updateProduct,
  deleteProduct,
  restockProduct,
} from './commands/medications';
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
const auditRepo = new PrismaAuditRepository(prisma);
const credentialsRepo = new PrismaCredentialsRepository(prisma);
const transactor = new PrismaTransactor(prisma);
const eventBus = new SimpleEventBus();

const createActorUseCase = new CreateActorUseCase(actorRepo, credentialsRepo, transactor, eventBus);
const deleteActorUseCase = new DeleteActorUseCase(actorRepo, transactor, eventBus);
const createWardUnitUseCase = new CreateWardUnitUseCase(wardUnitRepo, actorRepo, transactor, eventBus);
const updateWardUnitUseCase = new UpdateWardUnitUseCase(wardUnitRepo, actorRepo, transactor, eventBus);
const deleteWardUnitUseCase = new DeleteWardUnitUseCase(wardUnitRepo, actorRepo, transactor, eventBus);

const createOrderUseCase = new CreateOrderUseCase(actorRepo, transactor, eventBus);
const updateOrderLinesUseCase = new UpdateOrderLinesUseCase(actorRepo, orderRepo, transactor, eventBus);
const sendOrderUseCase = new SendOrderUseCase(actorRepo, orderRepo, transactor, eventBus);
const confirmOrderUseCase = new ConfirmOrderUseCase(actorRepo, orderRepo, transactor, eventBus);
const deliverOrderUseCase = new DeliverOrderUseCase(actorRepo, orderRepo, medicinalProductRepo, transactor, eventBus);
const restockUseCase = new RestockUseCase(actorRepo, medicinalProductRepo, transactor, eventBus);
const createMedicationUseCase = new CreateMedicationUseCase(medicationRepo, actorRepo, transactor);
const updateMedicationUseCase = new UpdateMedicationUseCase(medicationRepo, actorRepo, transactor);
const deleteMedicationUseCase = new DeleteMedicationUseCase(medicationRepo, medicinalProductRepo, actorRepo, transactor);
const createMedicinalProductUseCase = new CreateMedicinalProductUseCase(medicinalProductRepo, medicationRepo, actorRepo, transactor);
const updateMedicinalProductUseCase = new UpdateMedicinalProductUseCase(medicinalProductRepo, actorRepo, transactor);
const deleteMedicinalProductUseCase = new DeleteMedicinalProductUseCase(medicinalProductRepo, actorRepo, transactor);

const output = new ConsoleOutput();

async function requireAuth(): Promise<{ actorId: string; wardUnitId?: string }> {
  const token = readToken();
  if (!token) {
    output.error('Not logged in. Run: npm run mt-cli -- login --actor-id <id> --password <password>');
    process.exit(1);
  }
  try {
    const { actorId, wardUnitId } = await verifyToken(token);
    return { actorId, wardUnitId };
  } catch {
    output.error('Session expired. Run: npm run mt-cli -- login --actor-id <id> --password <password>');
    process.exit(1);
  }
}

// --- Commands ---
const program = new Command();
program.name('mt-cli').description('Medication tracking CLI');

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

const audit = program.command('audit');

audit
  .command('list')
  .description('List audit log entries')
  .option('--actor-id <id>', 'filter by actor')
  .option('--order-id <id>', 'filter by order')
  .action(async (opts) => listAudit(auditRepo, output, { actorId: opts.actorId, orderId: opts.orderId }));

const actors = program.command('actors');

actors
  .command('list')
  .description('List all actors and their roles')
  .action(async () => listActors(actorRepo, output));

actors
  .command('delete <actorId>')
  .description('Delete an actor (admin only)')
  .action(async (actorId) => {
    const { actorId: requestingActorId } = await requireAuth();
    return deleteActor(deleteActorUseCase, output, requestingActorId, actorId);
  });

actors
  .command('bootstrap-create')
  .description('Create the first admin actor on a fresh database (blocked if any admin already exists)')
  .requiredOption('--actor-id <id>', 'actor ID for the new actor')
  .requiredOption('--role <role>', 'role (Nurse, Pharmacist, Admin)')
  .option('--ward-unit-id <id>', 'ward unit ID (required for Nurse role)')
  .requiredOption('--password <password>', 'initial password')
  .action(async (opts) =>
    bootstrapCreateActor(actorRepo, credentialsRepo, output, opts.actorId, opts.role, opts.wardUnitId, opts.password),
  );

actors
  .command('create')
  .description('Create a new actor (admin only)')
  .requiredOption('--actor-id <id>', 'actor ID for the new actor')
  .requiredOption('--role <role>', 'role (Nurse, Pharmacist, Admin)')
  .option('--ward-unit-id <id>', 'ward unit ID (required for Nurse role)')
  .requiredOption('--password <password>', 'initial password')
  .action(async (opts) => {
    const { actorId } = await requireAuth();
    return createActor(createActorUseCase, output, actorId, opts.actorId, opts.role, opts.wardUnitId, opts.password);
  });

const wardUnits = program.command('ward-units');

wardUnits
  .command('list')
  .description('List all ward units')
  .action(async () => listWardUnits(wardUnitRepo, output));

wardUnits
  .command('create')
  .description('Create a new ward unit (admin only)')
  .requiredOption('--ward-unit-id <id>', 'ward unit ID')
  .requiredOption('--name <name>', 'display name')
  .action(async (opts) => {
    const { actorId } = await requireAuth();
    return createWardUnit(createWardUnitUseCase, output, actorId, opts.wardUnitId, opts.name);
  });

wardUnits
  .command('update <wardUnitId>')
  .description('Update a ward unit name (admin only)')
  .requiredOption('--name <name>', 'new display name')
  .action(async (wardUnitId, opts) => {
    const { actorId } = await requireAuth();
    return updateWardUnit(updateWardUnitUseCase, output, actorId, wardUnitId, opts.name);
  });

wardUnits
  .command('delete <wardUnitId>')
  .description('Delete a ward unit (admin only)')
  .action(async (wardUnitId) => {
    const { actorId } = await requireAuth();
    return deleteWardUnit(deleteWardUnitUseCase, output, actorId, wardUnitId);
  });

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

medications
  .command('create')
  .description('Create a new medication (pharmacist only)')
  .requiredOption('--inn-name <name>', 'INN (generic) name')
  .requiredOption('--atc-code <code>', 'ATC code')
  .requiredOption('--form <form>', 'dosage form (e.g. Tablet, Capsule, Solution)')
  .requiredOption('--strength <strength>', 'strength (e.g. "500 mg")')
  .action(async (opts) => {
    const { actorId } = await requireAuth();
    return createMedication(createMedicationUseCase, output, actorId, opts.innName, opts.atcCode, opts.form, opts.strength);
  });

medications
  .command('update <medicationId>')
  .description('Update a medication (pharmacist only)')
  .option('--inn-name <name>', 'new INN name')
  .option('--atc-code <code>', 'new ATC code')
  .option('--form <form>', 'new dosage form')
  .option('--strength <strength>', 'new strength')
  .action(async (medicationId, opts) => {
    const { actorId } = await requireAuth();
    return updateMedication(updateMedicationUseCase, output, actorId, medicationId, {
      innName: opts.innName,
      atcCode: opts.atcCode,
      form: opts.form,
      strength: opts.strength,
    });
  });

medications
  .command('delete <medicationId>')
  .description('Delete a medication (pharmacist only — blocked if products exist)')
  .action(async (medicationId) => {
    const { actorId } = await requireAuth();
    return deleteMedication(deleteMedicationUseCase, output, actorId, medicationId);
  });

const products = program.command('products');

products
  .command('add <medicationId>')
  .description('Add a medicinal product to a medication (pharmacist only)')
  .requiredOption('--product-name <name>', 'product name (e.g. "Alvedon 500 mg")')
  .requiredOption('--stock-level <n>', 'initial stock level', parseInt)
  .requiredOption('--stock-threshold <n>', 'low-stock threshold', parseInt)
  .action(async (medicationId, opts) => {
    const { actorId } = await requireAuth();
    return addProduct(createMedicinalProductUseCase, output, actorId, medicationId, opts.productName, opts.stockLevel, opts.stockThreshold);
  });

products
  .command('update <productId>')
  .description('Update a medicinal product (pharmacist only)')
  .option('--product-name <name>', 'new product name')
  .option('--stock-threshold <n>', 'new low-stock threshold', parseInt)
  .action(async (productId, opts) => {
    const { actorId } = await requireAuth();
    return updateProduct(updateMedicinalProductUseCase, output, actorId, productId, {
      productName: opts.productName,
      stockThreshold: opts.stockThreshold,
    });
  });

products
  .command('delete <productId>')
  .description('Delete a medicinal product (pharmacist only)')
  .action(async (productId) => {
    const { actorId } = await requireAuth();
    return deleteProduct(deleteMedicinalProductUseCase, output, actorId, productId);
  });

products
  .command('restock <productId>')
  .description('Add stock to a medicinal product (pharmacist only)')
  .requiredOption('--quantity <n>', 'units to add', parseInt)
  .action(async (productId, opts) => {
    const { actorId } = await requireAuth();
    return restockProduct(restockUseCase, output, actorId, productId, opts.quantity);
  });

const orders = program.command('orders');

orders
  .command('list')
  .description('List all orders')
  .action(async () => listOrders(orderRepo, output));

orders
  .command('create')
  .description('Create a new order (nurse only — ward unit derived from your session)')
  .requiredOption('--medication-id <id>', 'medication ID')
  .requiredOption('--quantity <n>', 'quantity', parseInt)
  .action(async (opts) => {
    const { actorId } = await requireAuth();
    return createOrder(createOrderUseCase, output, actorId, opts.medicationId, opts.quantity);
  });

orders
  .command('send <orderId>')
  .description('Send a draft order to the pharmacy')
  .action(async (orderId) => {
    const { actorId } = await requireAuth();
    return sendOrder(sendOrderUseCase, output, actorId, orderId);
  });

orders
  .command('confirm <orderId>')
  .description('Confirm receipt of a sent order')
  .action(async (orderId) => {
    const { actorId } = await requireAuth();
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
    const { actorId } = await requireAuth();
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
    const { actorId } = await requireAuth();
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
      actorRepo,
      auditRepo,
      credentialsRepo,
      createOrderUseCase,
      updateOrderLinesUseCase,
      sendOrderUseCase,
      confirmOrderUseCase,
      deliverOrderUseCase,
      restockUseCase,
      actorId,
    };
    await runGraphQL(context, output, query, variables);
  });

console.warn('NOTE: mt-cli reads/writes the database directly. It does not connect to the event system — live UI clients will not receive real-time updates for changes made here.\n');

program.parseAsync().catch((err: unknown) => {
  output.error(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  output.exit(1);
});
