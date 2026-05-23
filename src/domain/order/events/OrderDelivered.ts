import { DomainEvent } from '../../shared/DomainEvent';
import { Order } from '../Order';

export class OrderDelivered implements DomainEvent {
  readonly eventType = 'OrderDelivered';
  readonly occurredAt = new Date();

  constructor(
    public readonly actorId: string,
    public readonly order: Order,
  ) {}
}
