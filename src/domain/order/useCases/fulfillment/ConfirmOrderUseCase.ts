// Performed by a pharmacist. Confirms receipt of a sent order, making it ready for delivery.

import { Order } from '../../Order';
import { OrderStatus } from '../../OrderStatus';
import { OrderRepository } from '../../OrderRepository';
import { EventBus } from '../../../shared/eventContracts/EventBus';
import { UseCaseResult, success, failure } from '../../../shared/results/UseCaseResult';
import { OrderStatusAdvanced } from '../../events/OrderStatusAdvanced';
import { OrderId } from '../../../shared/IdTypes';
import { ActorRole } from '../../../shared/ActorRole';

export interface ConfirmOrderInput {
  actorId: string;
  actorRole: ActorRole;
  orderId: OrderId;
}

export class ConfirmOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: ConfirmOrderInput): Promise<UseCaseResult<Order>> {
    if (input.actorRole !== ActorRole.Pharmacist) {
      return failure('UnauthorizedRole');
    }

    const order = await this.orderRepository.findById(input.orderId);
    if (order === undefined) {
      return failure('OrderNotFound');
    }

    if (order.status !== OrderStatus.Sent) {
      return failure('InvalidStatusTransition');
    }

    const previousStatus = order.status;
    order.status = OrderStatus.Confirmed;
    await this.orderRepository.save(order);
    await this.eventBus.publish(new OrderStatusAdvanced(input.actorId, order.id, previousStatus, OrderStatus.Confirmed));

    return success(order);
  }
}
