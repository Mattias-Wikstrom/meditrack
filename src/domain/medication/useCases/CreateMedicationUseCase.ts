import { randomUUID } from 'crypto';
import { Medication } from '../Medication';
import { MedicationRepository } from '../MedicationRepository';
import { ActorRepository } from '../../actor/ActorRepository';
import { ActorRole } from '../../shared/ActorRole';
import { Transactor } from '../../shared/Transactor';
import { UseCaseResult, success, failure, failures } from '../../shared/results/UseCaseResult';
import { MedicationId } from '../../shared/IdTypes';
import { MedicationForm } from '../MedicationForm';
import { MedicationRule } from '../rules/MedicationRule';
import { ValidAtcCode } from '../rules/ValidAtcCode';
import { ErrorInfo } from '../../shared/results/ErrorInfo';

export interface CreateMedicationInput {
  requestingActorId: string;
  innName: string;
  atcCode: string;
  form: MedicationForm;
  strength: string;
}

export class CreateMedicationUseCase {
  private readonly rules: MedicationRule[] = [
    new ValidAtcCode(),
  ];

  constructor(
    private readonly medicationRepository: MedicationRepository,
    private readonly actorRepository: ActorRepository,
    private readonly transactor: Transactor,
  ) {}

  async execute(input: CreateMedicationInput): Promise<UseCaseResult<Medication>> {
    const actor = await this.actorRepository.findById(input.requestingActorId);
    if (actor === undefined) return failure('ActorNotFound');
    if (actor.role !== ActorRole.Pharmacist) return failure('UnauthorizedRole');

    const medication = new Medication(
      randomUUID() as MedicationId,
      input.innName,
      input.atcCode,
      input.form,
      input.strength,
    );

    const errors: ErrorInfo[] = [];
    for (const rule of this.rules) {
      const error = rule.check(medication);
      if (error !== null) errors.push(error);
    }
    if (errors.length > 0) return failures(errors);

    await this.transactor.run(async (tx) => {
      await tx.medicationRepository.save(medication);
      await tx.auditRepository.record({
        actorId: input.requestingActorId,
        action: 'MedicationCreated',
        entityId: medication.id,
        occurredAt: new Date(),
      });
    });

    return success(medication);
  }
}
