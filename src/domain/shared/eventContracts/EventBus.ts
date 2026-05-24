import { DomainEvent } from './DomainEvent';
import { EventListener } from './EventListener';

/**
 * A publish-subscribe system for domain events.
 * 
 * Known implementation: SimpleEventBus
 *  
 * Possible future implementations:
 *  Outbox/transactional — with PostgreSQL, you want the event and the database write to be atomic. The standard pattern is to store the event in an outbox table in the same transaction, then have a background process relay it to listeners. The EventBus implementation would write to the outbox instead of dispatching in-process.
 *
 *  External broker adapter — an implementation that publishes to RabbitMQ, Kafka, or similar, for when events need to cross service boundaries.
 *
 *  Null bus — a no-op that drops all events, useful in tests that don't care about side effects. Your tests currently wire up SimpleEventBus everywhere even when the test has nothing to do with events; a NullEventBus would make that intent explicit.
 * 
 */
export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventType: string, listener: EventListener): void;
}
