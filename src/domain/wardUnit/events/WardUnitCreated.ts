import { DomainEvent } from '../../shared/eventContracts/DomainEvent';
import { WardUnit } from '../WardUnit';

export class WardUnitCreated implements DomainEvent {
  readonly eventType = 'WardUnitCreated';
  readonly occurredAt = new Date();

  constructor(
    public readonly actorId: string,
    public readonly created: WardUnit,
  ) {}
}
