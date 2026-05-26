import { DomainEvent } from '../../shared/eventContracts/DomainEvent';
import { Actor } from '../../shared/Actor';

export class ActorUpdated implements DomainEvent {
  readonly eventType = 'ActorUpdated';
  readonly occurredAt = new Date();

  constructor(
    public readonly actorId: string,
    public readonly updated: Actor,
  ) {}
}
