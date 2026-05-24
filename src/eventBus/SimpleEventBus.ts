import { DomainEvent } from '../domain/shared/eventContracts/DomainEvent';
import { EventBus } from '../domain/shared/eventContracts/EventBus';
import { EventListener } from '../domain/shared/eventContracts/EventListener';

/**
 * A minimal implementation of the EventBus interface.
 */
export class SimpleEventBus implements EventBus {
  private readonly listeners = new Map<string, EventListener[]>();

  subscribe(eventType: string, listener: EventListener): void {
    const existing = this.listeners.get(eventType) ?? [];
    this.listeners.set(eventType, [...existing, listener]);
  }

  async publish(event: DomainEvent): Promise<void> {
    const listeners = this.listeners.get(event.eventType) ?? [];
    for (const listener of listeners) {
      await listener.handle(event);
    }
  }
}
