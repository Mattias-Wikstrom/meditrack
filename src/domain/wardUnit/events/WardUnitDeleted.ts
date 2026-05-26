import { DomainEvent } from '../../shared/eventContracts/DomainEvent';

export class WardUnitDeleted implements DomainEvent {
  readonly eventType = 'WardUnitDeleted';
  readonly occurredAt = new Date();

  constructor(
    public readonly actorId: string,
    public readonly deletedId: string,
  ) {}
}
