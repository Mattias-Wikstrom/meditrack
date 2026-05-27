import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateMedicationUseCase } from '../../../src/domain/medication/useCases/UpdateMedicationUseCase';
import { InMemoryMedicationRepository } from '../../../src/storage/inMemory/InMemoryMedicationRepository';
import { InMemoryMedicinalProductRepository } from '../../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { InMemoryActorRepository } from '../../../src/storage/inMemory/InMemoryActorRepository';
import { InMemoryAuditRepository } from '../../../src/storage/inMemory/InMemoryAuditRepository';
import { InMemoryOrderRepository } from '../../../src/storage/inMemory/InMemoryOrderRepository';
import { InMemoryTransactor } from '../../../src/storage/inMemory/InMemoryTransactor';
import { ActorRole } from '../../../src/domain/shared/ActorRole';
import { MedicationForm } from '../../../src/domain/medication/MedicationForm';
import { Medication } from '../../../src/domain/medication/Medication';
import { MedicationId } from '../../../src/domain/shared/IdTypes';

const MED_ID = 'med-001' as MedicationId;

describe('UpdateMedicationUseCase', () => {
  let medicationRepo: InMemoryMedicationRepository;
  let actorRepo: InMemoryActorRepository;
  let auditRepo: InMemoryAuditRepository;
  let useCase: UpdateMedicationUseCase;

  beforeEach(async () => {
    actorRepo = new InMemoryActorRepository([
      { id: 'admin-1', role: ActorRole.Admin },
      { id: 'nurse-1', role: ActorRole.Nurse },
    ]);
    medicationRepo = new InMemoryMedicationRepository();
    await medicationRepo.save(new Medication(MED_ID, 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500 mg'));
    auditRepo = new InMemoryAuditRepository();
    const transactor = new InMemoryTransactor(
      new InMemoryOrderRepository(),
      new InMemoryMedicinalProductRepository(),
      auditRepo,
      actorRepo,
      undefined,
      medicationRepo,
    );
    useCase = new UpdateMedicationUseCase(medicationRepo, actorRepo, transactor);
  });

  it('updates the medication and writes an audit entry', async () => {
    const result = await useCase.execute({
      requestingActorId: 'admin-1',
      id: MED_ID,
      innName: 'Paracetamol Updated',
      strength: '1000 mg',
    });

    expect(result.successful).toBe(true);
    if (!result.successful) return;
    expect(result.value.innName).toBe('Paracetamol Updated');
    expect(result.value.strength).toBe('1000 mg');
    expect(result.value.atcCode).toBe('N02BE01');
    expect(auditRepo.getEntries()[0]?.action).toBe('MedicationUpdated');
    expect(auditRepo.getEntries()[0]?.entityId).toBe(MED_ID);
  });

  it('preserves unchanged fields', async () => {
    const result = await useCase.execute({
      requestingActorId: 'admin-1',
      id: MED_ID,
      atcCode: 'N02BE02',
    });

    expect(result.successful).toBe(true);
    if (!result.successful) return;
    expect(result.value.innName).toBe('Paracetamol');
    expect(result.value.atcCode).toBe('N02BE02');
    expect(result.value.form).toBe(MedicationForm.Tablet);
  });

  it('fails when the requesting actor is not found', async () => {
    const result = await useCase.execute({ requestingActorId: 'unknown', id: MED_ID });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('ActorNotFound');
  });

  it('fails when the requesting actor is not an admin', async () => {
    const result = await useCase.execute({ requestingActorId: 'nurse-1', id: MED_ID });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('UnauthorizedRole');
  });

  it('fails when the medication does not exist', async () => {
    const result = await useCase.execute({ requestingActorId: 'admin-1', id: 'no-such-med' as MedicationId });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('MedicationNotFound');
  });
});
