// Performed by a nurse. Creates a new medication order for a ward unit.

import { randomUUID } from 'crypto';
import { Order } from '../../Order';
import { OrderLine } from '../../OrderLine';
import { OrderStatus } from '../../OrderStatus';
import { OrderRule } from '../../rules/OrderRule';
import { OrderHasAtLeastOneLine } from '../../rules/OrderHasAtLeastOneLine';
import { OrderLineQuantitiesPositive } from '../../rules/OrderLineQuantitiesPositive';
import { ActorRepository } from '../../../actor/ActorRepository';
import { ActorRole } from '../../../shared/ActorRole';
import { Transactor } from '../../../shared/Transactor';
import { EventBus } from '../../../shared/eventContracts/EventBus';
import { UseCaseResult, success, failure, failures } from '../../../shared/results/UseCaseResult';
import { ErrorInfo } from '../../../shared/results/ErrorInfo';
import { DraftOrderCreated } from '../../events/DraftOrderCreated';
import { MedicationId, OrderId, WardUnitId } from '../../../shared/IdTypes';

export interface CreateOrderInput {
  actorId: string;
  lines: { medicationId: MedicationId; quantity: number }[];
}

export class CreateOrderUseCase {
  private readonly rules: OrderRule[] = [
    new OrderHasAtLeastOneLine(),
    new OrderLineQuantitiesPositive(),
  ];

  constructor(
    private readonly actorRepository: ActorRepository,
    private readonly transactor: Transactor,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreateOrderInput): Promise<UseCaseResult<Order>> {
    const actor = await this.actorRepository.findById(input.actorId);
    if (actor === undefined) {
      return failure('ActorNotFound');
    }
    if (actor.role !== ActorRole.Nurse) {
      return failure('UnauthorizedRole');
    }
    if (!actor.wardUnitId) {
      return failure('ActorNotAssignedToWardUnit');
    }

    const order = new Order(
      randomUUID() as OrderId,
      actor.wardUnitId as WardUnitId,
      input.lines.map((l) => new OrderLine(l.medicationId, l.quantity)),
      OrderStatus.Draft,
      new Date(),
    );

    const errors: ErrorInfo[] = [];
    for (const rule of this.rules) {
      const error = rule.check(order);
      if (error !== null) {
        errors.push(error);
      }
    }

    if (errors.length > 0) {
      return failures(errors);
    }

    await this.transactor.run(async (tx) => {
      await tx.orderRepository.save(order);
      await tx.auditRepository.record({ actorId: input.actorId, action: 'DraftOrderCreated', entityId: order.id, occurredAt: new Date() });
    });

    await this.eventBus.publish(new DraftOrderCreated(input.actorId, order));
    return success(order);
  }
}
