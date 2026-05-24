import { DomainEvent } from '../../shared/events/DomainEvent';
import { Order } from '../Order';

export class OrderPlaced implements DomainEvent {
  readonly eventType = 'OrderPlaced';
  readonly occurredAt = new Date();

  constructor(
    public readonly actorId: string,
    public readonly order: Order,
  ) {}
}
