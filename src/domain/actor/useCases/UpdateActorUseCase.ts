import { Actor } from '../../shared/Actor';
import { ActorRole } from '../../shared/ActorRole';
import { ActorRepository } from '../ActorRepository';
import { Transactor } from '../../shared/Transactor';
import { EventBus } from '../../shared/eventContracts/EventBus';
import { UseCaseResult, success, failure } from '../../shared/results/UseCaseResult';
import { ActorUpdated } from '../events/ActorUpdated';

export interface UpdateActorInput {
  requestingActorId: string;
  id: string;
  role?: ActorRole;
  wardUnitId?: string | null;
}

export class UpdateActorUseCase {
  constructor(
    private readonly actorRepository: ActorRepository,
    private readonly transactor: Transactor,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: UpdateActorInput): Promise<UseCaseResult<Actor>> {
    const requestingActor = await this.actorRepository.findById(input.requestingActorId);
    if (!requestingActor) return failure('ActorNotFound');
    if (requestingActor.role !== ActorRole.Admin) return failure('UnauthorizedRole');

    const existing = await this.actorRepository.findById(input.id);
    if (!existing) return failure('ActorNotFound');

    const newRole = input.role ?? existing.role;
    if (newRole !== ActorRole.Nurse && input.wardUnitId != null) {
      return failure('WardUnitAssignmentNotAllowed');
    }

    // If role stays Nurse and wardUnitId is omitted, preserve existing ward unit.
    // If wardUnitId is explicitly null, clear it.
    // If role changes away from Nurse, always clear ward unit.
    const newWardUnitId: string | undefined =
      newRole !== ActorRole.Nurse
        ? undefined
        : input.wardUnitId !== undefined
          ? (input.wardUnitId ?? undefined)
          : existing.wardUnitId;

    const updated: Actor = {
      id: existing.id,
      role: newRole,
      ...(newWardUnitId != null && { wardUnitId: newWardUnitId }),
    };

    await this.transactor.run(async (tx) => {
      await tx.actorRepository.save(updated);
      await tx.auditRepository.record({
        actorId: input.requestingActorId,
        action: 'ActorUpdated',
        entityId: input.id,
        occurredAt: new Date(),
      });
    });

    await this.eventBus.publish(new ActorUpdated(input.requestingActorId, updated));
    return success(updated);
  }
}
