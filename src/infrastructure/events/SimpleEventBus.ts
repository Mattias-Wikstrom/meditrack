import { DomainEvent } from '../../domain/shared/events/DomainEvent';
import { EventBus } from '../../domain/shared/events/EventBus';
import { EventListener } from '../../domain/shared/events/EventListener';

export class SimpleEventBus implements EventBus {
  private readonly listeners = new Map<string, EventListener[]>();

  subscribe(eventType: string, listener: EventListener): void {
    const existing = this.listeners.get(eventType) ?? [];
    this.listeners.set(eventType, [...existing, listener]);
  }

  publish(event: DomainEvent): void {
    const listeners = this.listeners.get(event.eventType) ?? [];
    for (const listener of listeners) {
      listener.handle(event);
    }
  }
}
