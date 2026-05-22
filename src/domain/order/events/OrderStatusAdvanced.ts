import { DomainEvent } from '../../shared/DomainEvent';
import { OrderStatus } from '../OrderStatus';

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
