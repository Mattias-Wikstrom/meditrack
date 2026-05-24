// Performed by a nurse. Creates a new medication order for a ward unit.

import { randomUUID } from 'crypto';
import { Order } from '../../Order';
import { OrderLine } from '../../OrderLine';
import { OrderStatus } from '../../OrderStatus';
import { OrderRepository } from '../../OrderRepository';
import { OrderRule } from '../../rules/OrderRule';
import { OrderHasAtLeastOneLine } from '../../rules/OrderHasAtLeastOneLine';
import { OrderLineQuantitiesPositive } from '../../rules/OrderLineQuantitiesPositive';
import { EventBus } from '../../../shared/eventContracts/EventBus';
import { UseCaseResult, success, failure, failures } from '../../../shared/results/UseCaseResult';
import { ErrorInfo } from '../../../shared/results/ErrorInfo';
import { OrderPlaced } from '../../events/OrderPlaced';
import { MedicationId, OrderId, WardUnitId } from '../../../shared/IdTypes';
import { ActorRole } from '../../../shared/ActorRole';

export interface CreateOrderInput {
  actorId: string;
  actorRole: ActorRole;
  wardUnitId: WardUnitId;
  lines: { medicationId: MedicationId; quantity: number }[];
}

export class CreateOrderUseCase {
  private readonly rules: OrderRule[] = [
    new OrderHasAtLeastOneLine(),
    new OrderLineQuantitiesPositive(),
  ];

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreateOrderInput): Promise<UseCaseResult<Order>> {
    if (input.actorRole !== ActorRole.Nurse) {
      return failure('UnauthorizedRole');
    }

    const order = new Order(
      randomUUID() as OrderId,
      input.wardUnitId,
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

    await this.orderRepository.save(order);
    await this.eventBus.publish(new OrderPlaced(input.actorId, order));
    return success(order);
  }
}
