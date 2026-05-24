import { OrderRepository } from '../../../domain/order/OrderRepository';
import { CreateOrderUseCase } from '../../../domain/order/useCases/ordering/CreateOrderUseCase';
import { AdvanceOrderStatusUseCase } from '../../../domain/order/useCases/fulfillment/AdvanceOrderStatusUseCase';
import { DeliverOrderUseCase } from '../../../domain/order/useCases/fulfillment/DeliverOrderUseCase';
import { MedicationId, OrderId, WardUnitId } from '../../../domain/shared/IdTypes';
import { CliOutput } from '../CliOutput';

export function listOrders(repo: OrderRepository, output: CliOutput): void {
  const orders = repo.findAll();

  if (orders.length === 0) {
    output.print('No orders.');
    return;
  }

  for (const order of orders) {
    output.print(`${order.id}  ${order.status}  ward: ${order.wardUnitId}  lines: ${order.lines.length}`);
  }
}

export function createOrder(
  useCase: CreateOrderUseCase,
  output: CliOutput,
  wardUnitId: string,
  medicationId: string,
  quantity: number,
): void {
  const result = useCase.execute({
    actorId: 'cli',
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

export function advanceOrder(
  useCase: AdvanceOrderStatusUseCase,
  output: CliOutput,
  orderId: string,
): void {
  const result = useCase.execute({ actorId: 'cli', orderId: orderId as OrderId });

  if (result.successful) {
    output.print(`Order ${orderId} is now: ${result.value.status}`);
  } else {
    output.error(`Failed: ${result.errors.map((e) => e.code).join(', ')}`);
    output.exit(1);
  }
}

export function deliverOrder(
  useCase: DeliverOrderUseCase,
  output: CliOutput,
  orderId: string,
): void {
  const result = useCase.execute({ actorId: 'cli', orderId: orderId as OrderId });

  if (result.successful) {
    output.print(`Order ${orderId} delivered.`);
  } else {
    output.error(`Failed: ${result.errors.map((e) => e.code).join(', ')}`);
    output.exit(1);
  }
}
