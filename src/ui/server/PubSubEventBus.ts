import { DomainEvent } from '../../domain/shared/eventContracts/DomainEvent';
import { EventBus } from '../../domain/shared/eventContracts/EventBus';
import { EventListener } from '../../domain/shared/eventContracts/EventListener';
import { OrderStatusAdvanced } from '../../domain/order/events/OrderStatusAdvanced';
import { StockBelowThreshold } from '../../domain/medication/events/StockBelowThreshold';
import { pubSub } from '../../eventBus/pubSub';

export class PubSubEventBus implements EventBus {
  // GraphQL subscriptions consume the pub/sub directly; listener-based subscriptions are unused in the server.
  subscribe(_eventType: string, _listener: EventListener): void {}

  async publish(event: DomainEvent): Promise<void> {
    if (event instanceof OrderStatusAdvanced) {
      pubSub.publish('OrderStatusAdvanced', event);
    } else if (event instanceof StockBelowThreshold) {
      pubSub.publish('StockBelowThreshold', event);
    }
  }
}
