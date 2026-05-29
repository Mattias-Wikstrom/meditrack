// Performed by a nurse. Submits a draft order to the pharmacy for fulfillment.

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

export interface SendOrderInput {
  actorId: string;
  orderId: OrderId;
}

export class SendOrderUseCase {
  constructor(
    private readonly actorRepository: ActorRepository,
    private readonly orderRepository: OrderRepository,
    private readonly transactor: Transactor,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: SendOrderInput): Promise<UseCaseResult<Order>> {
    const actor = await this.actorRepository.findById(input.actorId);
    if (actor === undefined) {
      return failure('ActorNotFound');
    }
    if (actor.role !== ActorRole.Nurse) {
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

    try {
      await this.transactor.run(async (tx) => {
        await tx.orderRepository.advanceStatus(order.id, OrderStatus.Sent, previousStatus);
        await tx.auditRepository.record({ actorId: input.actorId, action: 'OrderSent', entityId: order.id, occurredAt: new Date() });
      });
    } catch (e) {
      if (e instanceof ConflictError) {
        // Another request modified the order before ours committed. Re-read to find out what happened.
        const current = await this.orderRepository.findById(input.orderId);
        if (current?.status === OrderStatus.Sent) {
          // Someone else sent it concurrently — the goal is achieved, no need to re-publish.
          order.status = OrderStatus.Sent;
          return success(order);
        }
        return failure('InvalidStatusTransition');
      }
      throw e;
    }

    order.status = OrderStatus.Sent;
    await this.eventBus.publish(new OrderStatusAdvanced(input.actorId, order.id, previousStatus, OrderStatus.Sent));
    return success(order);
  }
}
