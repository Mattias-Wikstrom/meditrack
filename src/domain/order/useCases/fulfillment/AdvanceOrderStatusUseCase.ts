import { Order } from '../../Order';
import { OrderStatus } from '../../OrderStatus';
import { OrderRepository } from '../../OrderRepository';
import { EventBus } from '../../../shared/EventBus';
import { UseCaseResult, success, failure } from '../../../shared/UseCaseResult';
import { OrderStatusAdvanced } from '../../events/OrderStatusAdvanced';

export interface AdvanceOrderStatusInput {
  actorId: string;
  orderId: string;
}

const TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.Draft]: OrderStatus.Sent,
  [OrderStatus.Sent]: OrderStatus.Confirmed,
};

export class AdvanceOrderStatusUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventBus: EventBus,
  ) {}

  execute(input: AdvanceOrderStatusInput): UseCaseResult<Order> {
    const order = this.orderRepository.findById(input.orderId);
    if (order === undefined) {
      return failure('OrderNotFound');
    }

    const nextStatus = TRANSITIONS[order.status];
    if (nextStatus === undefined) {
      return failure('InvalidStatusTransition');
    }

    const previousStatus = order.status;
    order.status = nextStatus;
    this.orderRepository.save(order);
    this.eventBus.publish(new OrderStatusAdvanced(input.actorId, order.id, previousStatus, nextStatus));
    return success(order);
  }
}
