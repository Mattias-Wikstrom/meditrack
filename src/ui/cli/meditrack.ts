#!/usr/bin/env node
import { Command } from 'commander';
import { InMemoryMedicationRepository } from '../../storage/inMemory/InMemoryMedicationRepository';
import { InMemoryMedicinalProductRepository } from '../../storage/inMemory/InMemoryMedicinalProductRepository';
import { InMemoryOrderRepository } from '../../storage/inMemory/InMemoryOrderRepository';
import { SimpleEventBus } from '../../eventBus/SimpleEventBus';
import { CreateOrderUseCase } from '../../domain/order/useCases/ordering/CreateOrderUseCase';
import { AdvanceOrderStatusUseCase } from '../../domain/order/useCases/fulfillment/AdvanceOrderStatusUseCase';
import { DeliverOrderUseCase } from '../../domain/order/useCases/fulfillment/DeliverOrderUseCase';
import { ConsoleOutput } from './ConsoleOutput';
import { listMedications, showMedication } from './commands/medications';
import { listOrders, createOrder, advanceOrder, deliverOrder } from './commands/orders';

// --- Wiring ---
const medicationRepo = new InMemoryMedicationRepository();
const medicinalProductRepo = new InMemoryMedicinalProductRepository();
const orderRepo = new InMemoryOrderRepository();
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
  .action((opts) => listMedications(medicationRepo, output, opts.query));

medications
  .command('show <id>')
  .description('Show a medication and its registered medicinal products')
  .action((id) => showMedication(medicationRepo, medicinalProductRepo, output, id));

const orders = program.command('orders');

orders
  .command('list')
  .description('List all orders')
  .action(() => listOrders(orderRepo, output));

orders
  .command('create')
  .description('Create a new order')
  .requiredOption('--ward-unit-id <id>', 'ward unit ID')
  .requiredOption('--medication-id <id>', 'medication ID')
  .requiredOption('--quantity <n>', 'quantity', parseInt)
  .action((opts) => createOrder(createOrderUseCase, output, opts.wardUnitId, opts.medicationId, opts.quantity));

orders
  .command('advance <orderId>')
  .description('Advance an order to the next status')
  .action((orderId) => advanceOrder(advanceOrderStatusUseCase, output, orderId));

orders
  .command('deliver <orderId>')
  .description('Mark an order as delivered and update stock')
  .action((orderId) => deliverOrder(deliverOrderUseCase, output, orderId));

program.parse();
