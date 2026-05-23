import { DomainEvent } from '../../shared/DomainEvent';
import { OrderStatus } from '../OrderStatus';

// The order is progressing through a workflow — "advanced" captures 
// that directionality and intent better than the generic "changed."
export class OrderStatusAdvanced implements DomainEvent {
  readonly eventType = 'OrderStatusAdvanced';
  readonly occurredAt = new Date();

  constructor(
    public readonly actorId: string,
    public readonly orderId: string,
    public readonly from: OrderStatus,
    public readonly to: OrderStatus,
  ) {}
}
