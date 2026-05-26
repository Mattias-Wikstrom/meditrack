import { Actor } from '../../shared/Actor';
import { ActorRole } from '../../shared/ActorRole';
import { ActorRepository } from '../ActorRepository';
import { Transactor } from '../../shared/Transactor';
import { EventBus } from '../../shared/eventContracts/EventBus';
import { UseCaseResult, success, failure, failures } from '../../shared/results/UseCaseResult';
import { ErrorInfo } from '../../shared/results/ErrorInfo';
import { ActorRule } from '../rules/ActorRule';
import { NurseRequiresWardUnit } from '../rules/NurseRequiresWardUnit';
import { NonNurseCannotHaveWardUnit } from '../rules/NonNurseCannotHaveWardUnit';
import { ActorUpdated } from '../events/ActorUpdated';

export interface UpdateActorInput {
  requestingActorId: string;
  id: string;
  role?: ActorRole;
  wardUnitId?: string | null;
}

export class UpdateActorUseCase {
  // Business rules checked against the resulting actor before the update is saved
  private readonly rules: ActorRule[] = [
    new NurseRequiresWardUnit(),
    new NonNurseCannotHaveWardUnit(),
  ];

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

    // If wardUnitId is explicitly provided (including null to clear), honour it.
    // If omitted and the role is changing away from Nurse, auto-clear.
    // If omitted and the role stays Nurse (or becomes Nurse), preserve existing.
    const newWardUnitId: string | undefined =
      input.wardUnitId !== undefined
        ? (input.wardUnitId ?? undefined)
        : newRole !== ActorRole.Nurse
          ? undefined
          : existing.wardUnitId;

    const candidate: Actor = {
      id: existing.id,
      role: newRole,
      ...(newWardUnitId != null && { wardUnitId: newWardUnitId }),
    };

    const errors: ErrorInfo[] = [];
    for (const rule of this.rules) {
      const error = rule.check(candidate);
      if (error !== null) errors.push(error);
    }
    if (errors.length > 0) return failures(errors);

    await this.transactor.run(async (tx) => {
      await tx.actorRepository.save(candidate);
      await tx.auditRepository.record({
        actorId: input.requestingActorId,
        action: 'ActorUpdated',
        entityId: input.id,
        occurredAt: new Date(),
      });
    });

    await this.eventBus.publish(new ActorUpdated(input.requestingActorId, candidate));
    return success(candidate);
  }
}
