import { MedicinalProductRepository } from '../MedicinalProductRepository';
import { ActorRepository } from '../../actor/ActorRepository';
import { ActorRole } from '../../shared/ActorRole';
import { Transactor } from '../../shared/Transactor';
import { UseCaseResult, success, failure } from '../../shared/results/UseCaseResult';
import { MedicinalProductId } from '../../shared/IdTypes';

export interface DeleteMedicinalProductInput {
  requestingActorId: string;
  id: MedicinalProductId;
}

export class DeleteMedicinalProductUseCase {
  constructor(
    private readonly medicinalProductRepository: MedicinalProductRepository,
    private readonly actorRepository: ActorRepository,
    private readonly transactor: Transactor,
  ) {}

  async execute(input: DeleteMedicinalProductInput): Promise<UseCaseResult<void>> {
    const actor = await this.actorRepository.findById(input.requestingActorId);
    if (actor === undefined) return failure('ActorNotFound');
    if (actor.role !== ActorRole.Pharmacist) return failure('UnauthorizedRole');

    const product = await this.medicinalProductRepository.findById(input.id);
    if (product === undefined) return failure('MedicinalProductNotFound');

    await this.transactor.run(async (tx) => {
      await tx.medicinalProductRepository.delete(input.id);
      await tx.auditRepository.record({
        actorId: input.requestingActorId,
        action: 'MedicinalProductDeleted',
        entityId: input.id,
        occurredAt: new Date(),
      });
    });

    return success(undefined);
  }
}
