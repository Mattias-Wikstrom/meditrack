import { DomainEvent } from './DomainEvent';

/**
 * Known implementations: AuditListener
 */
export interface EventListener {
  handle(event: DomainEvent): void;
}
