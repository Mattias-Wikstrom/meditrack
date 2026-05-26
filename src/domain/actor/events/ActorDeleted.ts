import { DomainEvent } from '../../shared/eventContracts/DomainEvent';

export class ActorDeleted implements DomainEvent {
  readonly eventType = 'ActorDeleted';
  readonly occurredAt = new Date();

  constructor(
    public readonly actorId: string,
    public readonly deletedId: string,
  ) {}
}
