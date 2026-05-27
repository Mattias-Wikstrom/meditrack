import { Medication } from '../Medication';
import { MedicationRepository } from '../MedicationRepository';
import { ActorRepository } from '../../actor/ActorRepository';
import { ActorRole } from '../../shared/ActorRole';
import { Transactor } from '../../shared/Transactor';
import { UseCaseResult, success, failure, failures } from '../../shared/results/UseCaseResult';
import { MedicationId } from '../../shared/IdTypes';
import { MedicationForm } from '../MedicationForm';
import { MedicationRule } from '../rules/interfaces/MedicationRule';
import { ValidAtcCode } from '../rules/ValidAtcCode';
import { ErrorInfo } from '../../shared/results/ErrorInfo';

export interface UpdateMedicationInput {
  requestingActorId: string;
  id: MedicationId;
  innName?: string;
  atcCode?: string;
  form?: MedicationForm;
  strength?: string;
}

export class UpdateMedicationUseCase {
  private readonly rules: MedicationRule[] = [
    new ValidAtcCode(),
  ];

  constructor(
    private readonly medicationRepository: MedicationRepository,
    private readonly actorRepository: ActorRepository,
    private readonly transactor: Transactor,
  ) {}

  async execute(input: UpdateMedicationInput): Promise<UseCaseResult<Medication>> {
    const actor = await this.actorRepository.findById(input.requestingActorId);
    if (actor === undefined) return failure('ActorNotFound');
    if (actor.role !== ActorRole.Admin) return failure('UnauthorizedRole');

    const existing = await this.medicationRepository.findById(input.id);
    if (existing === undefined) return failure('MedicationNotFound');

    const updated = new Medication(
      existing.id,
      input.innName ?? existing.innName,
      input.atcCode ?? existing.atcCode,
      input.form ?? existing.form,
      input.strength ?? existing.strength,
    );

    const errors: ErrorInfo[] = [];
    for (const rule of this.rules) {
      const error = rule.check(updated);
      if (error !== null) errors.push(error);
    }
    if (errors.length > 0) return failures(errors);

    await this.transactor.run(async (tx) => {
      await tx.medicationRepository.save(updated);
      await tx.auditRepository.record({
        actorId: input.requestingActorId,
        action: 'MedicationUpdated',
        entityId: updated.id,
        occurredAt: new Date(),
      });
    });

    return success(updated);
  }
}
