import { ActorRole } from '../../shared/ActorRole';
import { ActorRepository } from '../ActorRepository';
import { Transactor } from '../../shared/Transactor';
import { EventBus } from '../../shared/eventContracts/EventBus';
import { UseCaseResult, success, failure } from '../../shared/results/UseCaseResult';
import { ActorDeleted } from '../events/ActorDeleted';

export interface DeleteActorInput {
  requestingActorId: string;
  id: string;
}

export class DeleteActorUseCase {
  constructor(
    private readonly actorRepository: ActorRepository,
    private readonly transactor: Transactor,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: DeleteActorInput): Promise<UseCaseResult<void>> {
    const requestingActor = await this.actorRepository.findById(input.requestingActorId);
    if (!requestingActor) return failure('ActorNotFound');
    if (requestingActor.role !== ActorRole.Admin) return failure('UnauthorizedRole');

    const existing = await this.actorRepository.findById(input.id);
    if (!existing) return failure('ActorNotFound');

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
