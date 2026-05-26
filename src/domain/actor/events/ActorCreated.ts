import { DomainEvent } from '../../shared/eventContracts/DomainEvent';
import { Actor } from '../../shared/Actor';

export class ActorCreated implements DomainEvent {
  readonly eventType = 'ActorCreated';
  readonly occurredAt = new Date();

  constructor(
    public readonly actorId: string,
    public readonly created: Actor,
  ) {}
}
