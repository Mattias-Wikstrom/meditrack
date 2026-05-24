#!/usr/bin/env node
import { Command } from 'commander';
import { prisma } from '../../storage/prisma/prismaClient';
import { PrismaMedicationRepository } from '../../storage/prisma/PrismaMedicationRepository';
import { PrismaMedicinalProductRepository } from '../../storage/prisma/PrismaMedicinalProductRepository';
import { PrismaOrderRepository } from '../../storage/prisma/PrismaOrderRepository';
import { SimpleEventBus } from '../../eventBus/SimpleEventBus';
import { CreateOrderUseCase } from '../../domain/order/useCases/ordering/CreateOrderUseCase';
import { SendOrderUseCase } from '../../domain/order/useCases/fulfillment/SendOrderUseCase';
import { ConfirmOrderUseCase } from '../../domain/order/useCases/fulfillment/ConfirmOrderUseCase';
import { DeliverOrderUseCase } from '../../domain/order/useCases/fulfillment/DeliverOrderUseCase';
import { ConsoleOutput } from './ConsoleOutput';
import { listMedications, showMedication } from './commands/medications';
import { listOrders, createOrder, sendOrder, confirmOrder, deliverOrder } from './commands/orders';

// --- Wiring ---
const medicationRepo = new PrismaMedicationRepository(prisma);
const medicinalProductRepo = new PrismaMedicinalProductRepository(prisma);
const orderRepo = new PrismaOrderRepository(prisma);
const eventBus = new SimpleEventBus();

const createOrderUseCase = new CreateOrderUseCase(orderRepo, eventBus);
const sendOrderUseCase = new SendOrderUseCase(orderRepo, eventBus);
const confirmOrderUseCase = new ConfirmOrderUseCase(orderRepo, eventBus);
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
  .command('send <orderId>')
  .description('Send a draft order to the pharmacy')
  .action(async (orderId) => sendOrder(sendOrderUseCase, output, orderId));

orders
  .command('confirm <orderId>')
  .description('Confirm receipt of a sent order')
  .action(async (orderId) => confirmOrder(confirmOrderUseCase, output, orderId));

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
    const productSelections = (opts.product as string[]).map((spec) => {
      const [medicationId, medicinalProductId, quantityStr] = spec.split(':');
      return {
        medicationId: medicationId ?? '',
        medicinalProductId: medicinalProductId ?? '',
        quantity: parseInt(quantityStr ?? '0', 10),
      };
    });
    return deliverOrder(deliverOrderUseCase, output, orderId, productSelections);
  });

program.parse();
