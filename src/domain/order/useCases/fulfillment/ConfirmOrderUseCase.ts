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
import { ConflictError } from '../../../shared/ConflictError';

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

    try {
      await this.transactor.run(async (tx) => {
        await tx.orderRepository.advanceStatus(order.id, OrderStatus.Confirmed, previousStatus);
        await tx.auditRepository.record({ actorId: input.actorId, action: 'OrderConfirmed', entityId: order.id, occurredAt: new Date() });
      });
    } catch (e) {
      if (e instanceof ConflictError) {
        // Another request modified the order before ours committed. Re-read to find out what happened.
        const current = await this.orderRepository.findById(input.orderId);
        if (current?.status === OrderStatus.Confirmed) {
          // Someone else confirmed it concurrently — the goal is achieved, no need to re-publish.
          order.status = OrderStatus.Confirmed;
          return success(order);
        }
        return failure('InvalidStatusTransition');
      }
      throw e;
    }

    order.status = OrderStatus.Confirmed;
    await this.eventBus.publish(new OrderStatusAdvanced(input.actorId, order.id, previousStatus, OrderStatus.Confirmed));
    return success(order);
  }
}
