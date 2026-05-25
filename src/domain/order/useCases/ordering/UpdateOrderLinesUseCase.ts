// Performed by a nurse. Replaces the line list on an existing Draft order.
// No minimum-lines validation here — that is enforced at send time.

import { Order } from '../../Order';
import { OrderLine } from '../../OrderLine';
import { OrderStatus } from '../../OrderStatus';
import { OrderRepository } from '../../OrderRepository';
import { ActorRepository } from '../../../actor/ActorRepository';
import { ActorRole } from '../../../shared/ActorRole';
import { Transactor } from '../../../shared/Transactor';
import { EventBus } from '../../../shared/eventContracts/EventBus';
import { UseCaseResult, success, failure } from '../../../shared/results/UseCaseResult';
import { MedicationId, OrderId } from '../../../shared/IdTypes';
import { DraftOrderUpdated } from '../../events/DraftOrderUpdated';

export interface UpdateOrderLinesInput {
  actorId: string;
  orderId: OrderId;
  lines: { medicationId: MedicationId; quantity: number }[];
}

export class UpdateOrderLinesUseCase {
  constructor(
    private readonly actorRepository: ActorRepository,
    private readonly orderRepository: OrderRepository,
    private readonly transactor: Transactor,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: UpdateOrderLinesInput): Promise<UseCaseResult<Order>> {
    const actor = await this.actorRepository.findById(input.actorId);
    if (actor === undefined) return failure('ActorNotFound');
    if (actor.role !== ActorRole.Nurse) return failure('UnauthorizedRole');

    const order = await this.orderRepository.findById(input.orderId);
    if (order === undefined) return failure('OrderNotFound');
    if (order.status !== OrderStatus.Draft) return failure('InvalidStatusTransition');

    if (input.lines.some((l) => l.quantity <= 0)) return failure('OrderLineQuantitiesPositive');

    const updatedOrder = new Order(
      order.id,
      order.wardUnitId,
      input.lines.map((l) => new OrderLine(l.medicationId, l.quantity)),
      order.status,
      order.createdAt,
    );

    await this.transactor.run(async (tx) => {
      await tx.orderRepository.save(updatedOrder);
    });

    await this.eventBus.publish(new DraftOrderUpdated(input.actorId, updatedOrder));
    return success(updatedOrder);
  }
}
