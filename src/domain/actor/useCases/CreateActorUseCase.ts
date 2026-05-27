import bcrypt from 'bcryptjs';
import { Actor } from '../../shared/Actor';
import { ActorRole } from '../../shared/ActorRole';
import { ActorRepository } from '../ActorRepository';
import { CredentialsRepository } from '../../auth/CredentialsRepository';
import { Transactor } from '../../shared/Transactor';
import { EventBus } from '../../shared/eventContracts/EventBus';
import { UseCaseResult, success, failure, failures } from '../../shared/results/UseCaseResult';
import { ErrorInfo } from '../../shared/results/ErrorInfo';
import { ActorRule } from '../rules/interfaces/ActorRule';
import { NurseRequiresWardUnit } from '../rules/NurseRequiresWardUnit';
import { NonNurseCannotHaveWardUnit } from '../rules/NonNurseCannotHaveWardUnit';
import { ActorCreated } from '../events/ActorCreated';

export interface CreateActorInput {
  requestingActorId: string;
  id: string;
  role: ActorRole;
  wardUnitId?: string;
  password: string;
}

export class CreateActorUseCase {
  // Business rules checked against the candidate actor before it is saved
  private readonly rules: ActorRule[] = [
    new NurseRequiresWardUnit(),
    new NonNurseCannotHaveWardUnit(),
  ];

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

    const existing = await this.actorRepository.findById(input.id);
    if (existing) return failure('ActorAlreadyExists');

    const candidate: Actor = {
      id: input.id,
      role: input.role,
      ...(input.wardUnitId != null && { wardUnitId: input.wardUnitId }),
    };

    const errors: ErrorInfo[] = [];
    for (const rule of this.rules) {
      const error = rule.check(candidate);
      if (error !== null) errors.push(error);
    }
    if (errors.length > 0) return failures(errors);

    const passwordHash = await bcrypt.hash(input.password, 10);

    await this.transactor.run(async (tx) => {
      await tx.actorRepository.save(candidate);
      await tx.auditRepository.record({
        actorId: input.requestingActorId,
        action: 'ActorCreated',
        entityId: input.id,
        occurredAt: new Date(),
      });
    });

    await this.credentialsRepository.setPasswordHash(input.id, passwordHash);

    await this.eventBus.publish(new ActorCreated(input.requestingActorId, candidate));
    return success(candidate);
  }
}
