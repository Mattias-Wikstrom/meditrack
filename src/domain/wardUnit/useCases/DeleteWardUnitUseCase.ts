import { WardUnit } from '../WardUnit';
import { WardUnitId } from '../../shared/IdTypes';
import { WardUnitRepository } from '../WardUnitRepository';
import { ActorRepository } from '../../actor/ActorRepository';
import { ActorRole } from '../../shared/ActorRole';
import { Transactor } from '../../shared/Transactor';
import { EventBus } from '../../shared/eventContracts/EventBus';
import { UseCaseResult, success, failure, failures } from '../../shared/results/UseCaseResult';
import { ErrorInfo } from '../../shared/results/ErrorInfo';
import { DeleteWardUnitRule } from '../rules/DeleteWardUnitRule';
import { WardUnitHasNoNurses } from '../rules/WardUnitHasNoNurses';
import { WardUnitDeleted } from '../events/WardUnitDeleted';

export interface DeleteWardUnitInput {
  requestingActorId: string;
  id: string;
}

export class DeleteWardUnitUseCase {
  // Business rules checked against the ward unit before deletion
  private readonly rules: DeleteWardUnitRule[] = [
    new WardUnitHasNoNurses(),
  ];

  constructor(
    private readonly wardUnitRepository: WardUnitRepository,
    private readonly actorRepository: ActorRepository,
    private readonly transactor: Transactor,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: DeleteWardUnitInput): Promise<UseCaseResult<void>> {
    const requestingActor = await this.actorRepository.findById(input.requestingActorId);
    if (!requestingActor) return failure('ActorNotFound');
    if (requestingActor.role !== ActorRole.Admin) return failure('UnauthorizedRole');

    const wardUnit = await this.wardUnitRepository.findById(input.id as WardUnitId);
    if (!wardUnit) return failure('WardUnitNotFound');

    const allActors = await this.actorRepository.findAll();
    const assignedNurses = allActors.filter((a) => a.wardUnitId === input.id);

    const errors: ErrorInfo[] = [];
    for (const rule of this.rules) {
      const error = rule.check(wardUnit, assignedNurses);
      if (error !== null) errors.push(error);
    }
    if (errors.length > 0) return failures(errors);

    await this.transactor.run(async (tx) => {
      await tx.wardUnitRepository.delete(input.id as WardUnitId);
      await tx.auditRepository.record({
        actorId: input.requestingActorId,
        action: 'WardUnitDeleted',
        entityId: input.id,
        occurredAt: new Date(),
      });
    });

    await this.eventBus.publish(new WardUnitDeleted(input.requestingActorId, input.id));
    return success(undefined);
  }
}
