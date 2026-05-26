import { WardUnit } from '../WardUnit';
import { WardUnitId } from '../../shared/IdTypes';
import { WardUnitRepository } from '../WardUnitRepository';
import { ActorRepository } from '../../actor/ActorRepository';
import { ActorRole } from '../../shared/ActorRole';
import { Transactor } from '../../shared/Transactor';
import { EventBus } from '../../shared/eventContracts/EventBus';
import { UseCaseResult, success, failure } from '../../shared/results/UseCaseResult';
import { WardUnitUpdated } from '../events/WardUnitUpdated';

export interface UpdateWardUnitInput {
  requestingActorId: string;
  id: string;
  name: string;
}

export class UpdateWardUnitUseCase {
  constructor(
    private readonly wardUnitRepository: WardUnitRepository,
    private readonly actorRepository: ActorRepository,
    private readonly transactor: Transactor,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: UpdateWardUnitInput): Promise<UseCaseResult<WardUnit>> {
    const requestingActor = await this.actorRepository.findById(input.requestingActorId);
    if (!requestingActor) return failure('ActorNotFound');
    if (requestingActor.role !== ActorRole.Admin) return failure('UnauthorizedRole');

    const existing = await this.wardUnitRepository.findById(input.id as WardUnitId);
    if (!existing) return failure('WardUnitNotFound');

    const updated = new WardUnit(existing.id, input.name);

    await this.transactor.run(async (tx) => {
      await tx.wardUnitRepository.save(updated);
      await tx.auditRepository.record({
        actorId: input.requestingActorId,
        action: 'WardUnitUpdated',
        entityId: input.id,
        occurredAt: new Date(),
      });
    });

    await this.eventBus.publish(new WardUnitUpdated(input.requestingActorId, updated));
    return success(updated);
  }
}
