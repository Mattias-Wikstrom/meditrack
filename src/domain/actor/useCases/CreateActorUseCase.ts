import bcrypt from 'bcryptjs';
import { Actor } from '../../shared/Actor';
import { ActorRole } from '../../shared/ActorRole';
import { ActorRepository } from '../ActorRepository';
import { CredentialsRepository } from '../../auth/CredentialsRepository';
import { Transactor } from '../../shared/Transactor';
import { EventBus } from '../../shared/eventContracts/EventBus';
import { UseCaseResult, success, failure } from '../../shared/results/UseCaseResult';
import { ActorCreated } from '../events/ActorCreated';

export interface CreateActorInput {
  requestingActorId: string;
  id: string;
  role: ActorRole;
  wardUnitId?: string;
  password: string;
}

export class CreateActorUseCase {
  constructor(
    private readonly actorRepository: ActorRepository,
    private readonly credentialsRepository: CredentialsRepository,
    private readonly transactor: Transactor,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreateActorInput): Promise<UseCaseResult<Actor>> {
    const requestingActor = await this.actorRepository.findById(input.requestingActorId);
    if (!requestingActor) return failure('ActorNotFound');
    if (requestingActor.role !== ActorRole.Admin) return failure('UnauthorizedRole');

    if (input.role !== ActorRole.Nurse && input.wardUnitId != null) {
      return failure('WardUnitAssignmentNotAllowed');
    }

    const actor: Actor = {
      id: input.id,
      role: input.role,
      ...(input.wardUnitId != null && { wardUnitId: input.wardUnitId }),
    };

    const passwordHash = await bcrypt.hash(input.password, 10);

    await this.transactor.run(async (tx) => {
      await tx.actorRepository.save(actor);
      await tx.auditRepository.record({
        actorId: input.requestingActorId,
        action: 'ActorCreated',
        entityId: input.id,
        occurredAt: new Date(),
      });
    });

    await this.credentialsRepository.setPasswordHash(input.id, passwordHash);

    await this.eventBus.publish(new ActorCreated(input.requestingActorId, actor));
    return success(actor);
  }
}
