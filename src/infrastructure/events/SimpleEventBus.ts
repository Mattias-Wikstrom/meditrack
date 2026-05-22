import { DomainEvent } from '../../domain/shared/DomainEvent';
import { EventBus } from '../../domain/shared/EventBus';
import { EventListener } from '../../domain/shared/EventListener';

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
