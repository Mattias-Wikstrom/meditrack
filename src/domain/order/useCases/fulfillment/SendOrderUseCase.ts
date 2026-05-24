// Performed by a nurse. Submits a draft order to the pharmacy for fulfillment.

import { Order } from '../../Order';
import { OrderStatus } from '../../OrderStatus';
import { OrderRepository } from '../../OrderRepository';
import { EventBus } from '../../../shared/eventContracts/EventBus';
import { UseCaseResult, success, failure } from '../../../shared/results/UseCaseResult';
import { OrderStatusAdvanced } from '../../events/OrderStatusAdvanced';
import { OrderId } from '../../../shared/IdTypes';
import { ActorRole } from '../../../shared/ActorRole';

export interface SendOrderInput {
  actorId: string;
  actorRole: ActorRole;
  orderId: OrderId;
}

export class SendOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: SendOrderInput): Promise<UseCaseResult<Order>> {
    if (input.actorRole !== ActorRole.Nurse) {
      return failure('UnauthorizedRole');
    }

    const order = await this.orderRepository.findById(input.orderId);
    if (order === undefined) {
      return failure('OrderNotFound');
    }

    if (order.status !== OrderStatus.Draft) {
      return failure('InvalidStatusTransition');
    }

    const previousStatus = order.status;
    order.status = OrderStatus.Sent;
    await this.orderRepository.save(order);
    await this.eventBus.publish(new OrderStatusAdvanced(input.actorId, order.id, previousStatus, OrderStatus.Sent));

    return success(order);
  }
}
