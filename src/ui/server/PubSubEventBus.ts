import { DomainEvent } from '../../domain/shared/eventContracts/DomainEvent';
import { EventBus } from '../../domain/shared/eventContracts/EventBus';
import { EventListener } from '../../domain/shared/eventContracts/EventListener';
import { pubSub } from '../../eventBus/pubSub';

export class PubSubEventBus implements EventBus {
  // GraphQL subscriptions consume the pub/sub directly; listener-based subscriptions are unused in the server.
  subscribe(_eventType: string, _listener: EventListener): void {}

  async publish(event: DomainEvent): Promise<void> {
    pubSub.publish(event.eventType as any, event as any);
  }
}
