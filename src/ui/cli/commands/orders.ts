import { OrderRepository } from '../../../domain/order/OrderRepository';
import { CreateOrderUseCase } from '../../../domain/order/useCases/ordering/CreateOrderUseCase';
import { SendOrderUseCase } from '../../../domain/order/useCases/fulfillment/SendOrderUseCase';
import { ConfirmOrderUseCase } from '../../../domain/order/useCases/fulfillment/ConfirmOrderUseCase';
import { DeliverOrderUseCase } from '../../../domain/order/useCases/fulfillment/DeliverOrderUseCase';
import { MedicationId, MedicinalProductId, OrderId, WardUnitId } from '../../../domain/shared/IdTypes';
import { ActorRole } from '../../../domain/shared/ActorRole';
import { CliOutput } from '../CliOutput';

export async function listOrders(repo: OrderRepository, output: CliOutput): Promise<void> {
  const orders = await repo.findAll();

  if (orders.length === 0) {
    output.print('No orders.');
    return;
  }

  for (const order of orders) {
    output.print(`${order.id}  ${order.status}  ward: ${order.wardUnitId}  lines: ${order.lines.length}`);
  }
}

export async function createOrder(
  useCase: CreateOrderUseCase,
  output: CliOutput,
  wardUnitId: string,
  medicationId: string,
  quantity: number,
): Promise<void> {
  const result = await useCase.execute({
    actorId: 'cli',
    actorRole: ActorRole.Nurse,
    wardUnitId: wardUnitId as WardUnitId,
    lines: [{ medicationId: medicationId as MedicationId, quantity }],
  });

  if (result.successful) {
    output.print(`Order created: ${result.value.id}  status: ${result.value.status}`);
  } else {
    output.error(`Failed: ${result.errors.map((e) => e.code).join(', ')}`);
    output.exit(1);
  }
}

export async function sendOrder(
  useCase: SendOrderUseCase,
  output: CliOutput,
  orderId: string,
): Promise<void> {
  const result = await useCase.execute({
    actorId: 'cli',
    actorRole: ActorRole.Nurse,
    orderId: orderId as OrderId,
  });

  if (result.successful) {
    output.print(`Order ${orderId} is now: ${result.value.status}`);
  } else {
    output.error(`Failed: ${result.errors.map((e) => e.code).join(', ')}`);
    output.exit(1);
  }
}

export async function confirmOrder(
  useCase: ConfirmOrderUseCase,
  output: CliOutput,
  orderId: string,
): Promise<void> {
  const result = await useCase.execute({
    actorId: 'cli',
    actorRole: ActorRole.Pharmacist,
    orderId: orderId as OrderId,
  });

  if (result.successful) {
    output.print(`Order ${orderId} is now: ${result.value.status}`);
  } else {
    output.error(`Failed: ${result.errors.map((e) => e.code).join(', ')}`);
    output.exit(1);
  }
}

export async function deliverOrder(
  useCase: DeliverOrderUseCase,
  output: CliOutput,
  orderId: string,
  productSelections: ReadonlyArray<{ medicationId: string; medicinalProductId: string; quantity: number }>,
): Promise<void> {
  const result = await useCase.execute({
    actorId: 'cli',
    actorRole: ActorRole.Pharmacist,
    orderId: orderId as OrderId,
    productSelections: productSelections.map((s) => ({
      medicationId: s.medicationId as MedicationId,
      medicinalProductId: s.medicinalProductId as MedicinalProductId,
      quantity: s.quantity,
    })),
  });

  if (result.successful) {
    output.print(`Order ${orderId} delivered.`);
  } else {
    output.error(`Failed: ${result.errors.map((e) => e.code).join(', ')}`);
    output.exit(1);
  }
}
