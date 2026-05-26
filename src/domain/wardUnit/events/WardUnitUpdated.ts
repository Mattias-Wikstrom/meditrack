import { DomainEvent } from '../../shared/eventContracts/DomainEvent';
import { WardUnit } from '../WardUnit';

export class WardUnitUpdated implements DomainEvent {
  readonly eventType = 'WardUnitUpdated';
  readonly occurredAt = new Date();

  constructor(
    public readonly actorId: string,
    public readonly updated: WardUnit,
  ) {}
}
