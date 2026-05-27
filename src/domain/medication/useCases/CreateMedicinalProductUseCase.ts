import { randomUUID } from 'crypto';
import { MedicinalProduct } from '../MedicinalProduct';
import { MedicinalProductRepository } from '../MedicinalProductRepository';
import { MedicationRepository } from '../MedicationRepository';
import { ActorRepository } from '../../actor/ActorRepository';
import { ActorRole } from '../../shared/ActorRole';
import { Transactor } from '../../shared/Transactor';
import { UseCaseResult, success, failure } from '../../shared/results/UseCaseResult';
import { MedicationId, MedicinalProductId } from '../../shared/IdTypes';

export interface CreateMedicinalProductInput {
  requestingActorId: string;
  medicationId: MedicationId;
  productName: string;
  stockLevel: number;
  stockThreshold: number;
}

export class CreateMedicinalProductUseCase {
  constructor(
    private readonly medicinalProductRepository: MedicinalProductRepository,
    private readonly medicationRepository: MedicationRepository,
    private readonly actorRepository: ActorRepository,
    private readonly transactor: Transactor,
  ) {}

  async execute(input: CreateMedicinalProductInput): Promise<UseCaseResult<MedicinalProduct>> {
    const actor = await this.actorRepository.findById(input.requestingActorId);
    if (actor === undefined) return failure('ActorNotFound');
    if (actor.role !== ActorRole.Pharmacist) return failure('UnauthorizedRole');

    const medication = await this.medicationRepository.findById(input.medicationId);
    if (medication === undefined) return failure('MedicationNotFound');

    const product = new MedicinalProduct(
      randomUUID() as MedicinalProductId,
      input.productName,
      input.medicationId,
      input.stockLevel,
      input.stockThreshold,
    );

    await this.transactor.run(async (tx) => {
      await tx.medicinalProductRepository.save(product);
      await tx.auditRepository.record({
        actorId: input.requestingActorId,
        action: 'MedicinalProductCreated',
        entityId: product.id,
        occurredAt: new Date(),
      });
    });

    return success(product);
  }
}
