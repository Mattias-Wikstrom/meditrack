import { MedicationRepository } from '../MedicationRepository';
import { MedicinalProductRepository } from '../MedicinalProductRepository';
import { ActorRepository } from '../../actor/ActorRepository';
import { ActorRole } from '../../shared/ActorRole';
import { Transactor } from '../../shared/Transactor';
import { UseCaseResult, success, failure, failures } from '../../shared/results/UseCaseResult';
import { MedicationId } from '../../shared/IdTypes';
import { DeleteMedicationRule } from '../rules/DeleteMedicationRule';
import { MedicationHasNoProducts } from '../rules/MedicationHasNoProducts';
import { ErrorInfo } from '../../shared/results/ErrorInfo';

export interface DeleteMedicationInput {
  requestingActorId: string;
  id: MedicationId;
}

export class DeleteMedicationUseCase {
  private readonly rules: DeleteMedicationRule[] = [
    new MedicationHasNoProducts(),
  ];

  constructor(
    private readonly medicationRepository: MedicationRepository,
    private readonly medicinalProductRepository: MedicinalProductRepository,
    private readonly actorRepository: ActorRepository,
    private readonly transactor: Transactor,
  ) {}

  async execute(input: DeleteMedicationInput): Promise<UseCaseResult<void>> {
    const actor = await this.actorRepository.findById(input.requestingActorId);
    if (actor === undefined) return failure('ActorNotFound');
    if (actor.role !== ActorRole.Pharmacist) return failure('UnauthorizedRole');

    const medication = await this.medicationRepository.findById(input.id);
    if (medication === undefined) return failure('MedicationNotFound');

    const products = await this.medicinalProductRepository.findByMedicationId(input.id);

    const errors: ErrorInfo[] = [];
    for (const rule of this.rules) {
      const error = rule.check(medication, products);
      if (error !== null) errors.push(error);
    }
    if (errors.length > 0) return failures(errors);

    await this.transactor.run(async (tx) => {
      await tx.medicationRepository.delete(input.id);
      await tx.auditRepository.record({
        actorId: input.requestingActorId,
        action: 'MedicationDeleted',
        entityId: input.id,
        occurredAt: new Date(),
      });
    });

    return success(undefined);
  }
}
