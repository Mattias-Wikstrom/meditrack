import { DomainEvent } from '../../shared/eventContracts/DomainEvent';
import { Order } from '../Order';

export class DraftOrderCreated implements DomainEvent {
  readonly eventType = 'DraftOrderCreated';
  readonly occurredAt = new Date();

  constructor(
    public readonly actorId: string,
    public readonly order: Order,
  ) {}
}
