import { OrderRepository } from '../../../domain/order/OrderRepository';
import { CreateOrderUseCase } from '../../../domain/order/useCases/ordering/CreateOrderUseCase';
import { AdvanceOrderStatusUseCase } from '../../../domain/order/useCases/fulfillment/AdvanceOrderStatusUseCase';
import { DeliverOrderUseCase } from '../../../domain/order/useCases/fulfillment/DeliverOrderUseCase';
import { MedicationId, OrderId, WardUnitId } from '../../../domain/shared/IdTypes';

export function listOrders(repo: OrderRepository): void {
  const orders = repo.findAll();

  if (orders.length === 0) {
    console.log('No orders.');
    return;
  }

  for (const order of orders) {
    console.log(`${order.id}  ${order.status}  ward: ${order.wardUnitId}  lines: ${order.lines.length}`);
  }
}

export function createOrder(
  useCase: CreateOrderUseCase,
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
    console.log(`Order created: ${result.value.id}  status: ${result.value.status}`);
  } else {
    console.error(`Failed: ${result.errors.map((e) => e.code).join(', ')}`);
    process.exit(1);
  }
}

export function advanceOrder(useCase: AdvanceOrderStatusUseCase, orderId: string): void {
  const result = useCase.execute({ actorId: 'cli', orderId: orderId as OrderId });

  if (result.successful) {
    console.log(`Order ${orderId} is now: ${result.value.status}`);
  } else {
    console.error(`Failed: ${result.errors.map((e) => e.code).join(', ')}`);
    process.exit(1);
  }
}

export function deliverOrder(useCase: DeliverOrderUseCase, orderId: string): void {
  const result = useCase.execute({ actorId: 'cli', orderId: orderId as OrderId });

  if (result.successful) {
    console.log(`Order ${orderId} delivered.`);
  } else {
    console.error(`Failed: ${result.errors.map((e) => e.code).join(', ')}`);
    process.exit(1);
  }
}
