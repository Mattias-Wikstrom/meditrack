import { Actor } from '../../shared/Actor';
import { ActorRole } from '../../shared/ActorRole';
import { ActorRepository } from '../ActorRepository';
import { Transactor } from '../../shared/Transactor';
import { EventBus } from '../../shared/eventContracts/EventBus';
import { UseCaseResult, success, failure, failures } from '../../shared/results/UseCaseResult';
import { ErrorInfo } from '../../shared/results/ErrorInfo';
import { DeleteActorRule } from '../rules/DeleteActorRule';
import { CannotDeleteSelf } from '../rules/CannotDeleteSelf';
import { ActorDeleted } from '../events/ActorDeleted';

export interface DeleteActorInput {
  requestingActorId: string;
  id: string;
}

export class DeleteActorUseCase {
  // Business rules checked against the requesting actor and the target before deletion
  private readonly rules: DeleteActorRule[] = [
    new CannotDeleteSelf(),
  ];

  constructor(
    private readonly actorRepository: ActorRepository,
    private readonly transactor: Transactor,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: DeleteActorInput): Promise<UseCaseResult<void>> {
    const requestingActor = await this.actorRepository.findById(input.requestingActorId);
    if (!requestingActor) return failure('ActorNotFound');
    if (requestingActor.role !== ActorRole.Admin) return failure('UnauthorizedRole');

    const target = await this.actorRepository.findById(input.id);
    if (!target) return failure('ActorNotFound');

    const errors: ErrorInfo[] = [];
    for (const rule of this.rules) {
      const error = rule.check(requestingActor, target);
      if (error !== null) errors.push(error);
    }
    if (errors.length > 0) return failures(errors);

    await this.transactor.run(async (tx) => {
      await tx.actorRepository.delete(input.id);
      await tx.auditRepository.record({
        actorId: input.requestingActorId,
        action: 'ActorDeleted',
        entityId: input.id,
        occurredAt: new Date(),
      });
    });

    await this.eventBus.publish(new ActorDeleted(input.requestingActorId, input.id));
    return success(undefined);
  }
}
