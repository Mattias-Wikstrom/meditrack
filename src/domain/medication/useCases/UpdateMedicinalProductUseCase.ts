import { MedicinalProduct } from '../MedicinalProduct';
import { MedicinalProductRepository } from '../MedicinalProductRepository';
import { ActorRepository } from '../../actor/ActorRepository';
import { ActorRole } from '../../shared/ActorRole';
import { Transactor } from '../../shared/Transactor';
import { UseCaseResult, success, failure } from '../../shared/results/UseCaseResult';
import { MedicinalProductId } from '../../shared/IdTypes';

export interface UpdateMedicinalProductInput {
  requestingActorId: string;
  id: MedicinalProductId;
  productName?: string;
  stockThreshold?: number;
}

export class UpdateMedicinalProductUseCase {
  constructor(
    private readonly medicinalProductRepository: MedicinalProductRepository,
    private readonly actorRepository: ActorRepository,
    private readonly transactor: Transactor,
  ) {}

  async execute(input: UpdateMedicinalProductInput): Promise<UseCaseResult<MedicinalProduct>> {
    const actor = await this.actorRepository.findById(input.requestingActorId);
    if (actor === undefined) return failure('ActorNotFound');
    if (actor.role !== ActorRole.Pharmacist) return failure('UnauthorizedRole');

    const existing = await this.medicinalProductRepository.findById(input.id);
    if (existing === undefined) return failure('MedicinalProductNotFound');

    const updated = new MedicinalProduct(
      existing.id,
      input.productName ?? existing.productName,
      existing.medicationId,
      existing.stockLevel,
      input.stockThreshold ?? existing.stockThreshold,
    );

    await this.transactor.run(async (tx) => {
      await tx.medicinalProductRepository.save(updated);
      await tx.auditRepository.record({
        actorId: input.requestingActorId,
        action: 'MedicinalProductUpdated',
        entityId: updated.id,
        occurredAt: new Date(),
      });
    });

    return success(updated);
  }
}
