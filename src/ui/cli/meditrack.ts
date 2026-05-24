#!/usr/bin/env node
import { Command } from 'commander';
import { prisma } from '../../storage/prisma/prismaClient';
import { PrismaMedicationRepository } from '../../storage/prisma/PrismaMedicationRepository';
import { PrismaMedicinalProductRepository } from '../../storage/prisma/PrismaMedicinalProductRepository';
import { PrismaOrderRepository } from '../../storage/prisma/PrismaOrderRepository';
import { SimpleEventBus } from '../../eventBus/SimpleEventBus';
import { CreateOrderUseCase } from '../../domain/order/useCases/ordering/CreateOrderUseCase';
import { AdvanceOrderStatusUseCase } from '../../domain/order/useCases/fulfillment/AdvanceOrderStatusUseCase';
import { DeliverOrderUseCase } from '../../domain/order/useCases/fulfillment/DeliverOrderUseCase';
import { ConsoleOutput } from './ConsoleOutput';
import { listMedications, showMedication } from './commands/medications';
import { listOrders, createOrder, advanceOrder, deliverOrder } from './commands/orders';

// --- Wiring ---
const medicationRepo = new PrismaMedicationRepository(prisma);
const medicinalProductRepo = new PrismaMedicinalProductRepository(prisma);
const orderRepo = new PrismaOrderRepository(prisma);
const eventBus = new SimpleEventBus();

const createOrderUseCase = new CreateOrderUseCase(orderRepo, eventBus);
const advanceOrderStatusUseCase = new AdvanceOrderStatusUseCase(orderRepo, eventBus);
const deliverOrderUseCase = new DeliverOrderUseCase(orderRepo, medicinalProductRepo, eventBus);

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
  .requiredOption('--ward-unit-id <id>', 'ward unit ID')
  .requiredOption('--medication-id <id>', 'medication ID')
  .requiredOption('--quantity <n>', 'quantity', parseInt)
  .action(async (opts) => createOrder(createOrderUseCase, output, opts.wardUnitId, opts.medicationId, opts.quantity));

orders
  .command('advance <orderId>')
  .description('Advance an order to the next status')
  .action(async (orderId) => advanceOrder(advanceOrderStatusUseCase, output, orderId));

orders
  .command('deliver <orderId>')
  .description('Mark an order as delivered and update stock')
  .action(async (orderId) => deliverOrder(deliverOrderUseCase, output, orderId));

program.parse();
