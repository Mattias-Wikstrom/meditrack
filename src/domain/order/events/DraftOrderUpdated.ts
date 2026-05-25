import { DomainEvent } from '../../shared/eventContracts/DomainEvent';
import { Order } from '../Order';

export class DraftOrderUpdated implements DomainEvent {
  readonly eventType = 'DraftOrderUpdated';
  readonly occurredAt = new Date();

  constructor(
    public readonly actorId: string,
    public readonly order: Order,
  ) {}
}
