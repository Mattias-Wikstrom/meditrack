// Performed by a pharmacist. Confirms receipt of a sent order, making it ready for delivery.

import { Order } from '../../Order';
import { OrderStatus } from '../../OrderStatus';
import { OrderRepository } from '../../OrderRepository';
import { ActorRepository } from '../../../actor/ActorRepository';
import { ActorRole } from '../../../shared/ActorRole';
import { Transactor } from '../../../shared/Transactor';
import { EventBus } from '../../../shared/eventContracts/EventBus';
import { UseCaseResult, success, failure } from '../../../shared/results/UseCaseResult';
import { OrderStatusAdvanced } from '../../events/OrderStatusAdvanced';
import { OrderId } from '../../../shared/IdTypes';

export interface ConfirmOrderInput {
  actorId: string;
  orderId: OrderId;
}

export class ConfirmOrderUseCase {
  constructor(
    private readonly actorRepository: ActorRepository,
    private readonly orderRepository: OrderRepository,
    private readonly transactor: Transactor,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: ConfirmOrderInput): Promise<UseCaseResult<Order>> {
    const actor = await this.actorRepository.findById(input.actorId);
    if (actor === undefined) {
      return failure('ActorNotFound');
    }
    if (actor.role !== ActorRole.Pharmacist) {
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

    await this.transactor.run(async (tx) => {
      await tx.orderRepository.save(order);
      await tx.auditRepository.record({ actorId: input.actorId, action: 'OrderConfirmed', entityId: order.id, occurredAt: new Date() });
    });

    await this.eventBus.publish(new OrderStatusAdvanced(input.actorId, order.id, previousStatus, OrderStatus.Confirmed));
    return success(order);
  }
}
