import { describe, it, expect, beforeEach } from 'vitest';
import { CreateMedicationUseCase } from '../../../src/domain/medication/useCases/CreateMedicationUseCase';
import { InMemoryMedicationRepository } from '../../../src/storage/inMemory/InMemoryMedicationRepository';
import { InMemoryMedicinalProductRepository } from '../../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { InMemoryActorRepository } from '../../../src/storage/inMemory/InMemoryActorRepository';
import { InMemoryAuditRepository } from '../../../src/storage/inMemory/InMemoryAuditRepository';
import { InMemoryOrderRepository } from '../../../src/storage/inMemory/InMemoryOrderRepository';
import { InMemoryTransactor } from '../../../src/storage/inMemory/InMemoryTransactor';
import { ActorRole } from '../../../src/domain/shared/ActorRole';
import { MedicationForm } from '../../../src/domain/medication/MedicationForm';

describe('CreateMedicationUseCase', () => {
  let medicationRepo: InMemoryMedicationRepository;
  let actorRepo: InMemoryActorRepository;
  let auditRepo: InMemoryAuditRepository;
  let useCase: CreateMedicationUseCase;

  const validInput = {
    requestingActorId: 'admin-1',
    innName: 'Paracetamol',
    atcCode: 'N02BE01',
    form: MedicationForm.Tablet,
    strength: '500 mg',
  };

  beforeEach(() => {
    actorRepo = new InMemoryActorRepository([
      { id: 'admin-1', role: ActorRole.Admin },
      { id: 'nurse-1', role: ActorRole.Nurse },
    ]);
    medicationRepo = new InMemoryMedicationRepository();
    auditRepo = new InMemoryAuditRepository();
    const transactor = new InMemoryTransactor(
      new InMemoryOrderRepository(),
      new InMemoryMedicinalProductRepository(),
      auditRepo,
      actorRepo,
      undefined,
      medicationRepo,
    );
    useCase = new CreateMedicationUseCase(medicationRepo, actorRepo, transactor);
  });

  it('saves the medication and writes an audit entry', async () => {
    const result = await useCase.execute(validInput);

    expect(result.successful).toBe(true);
    if (!result.successful) return;
    expect(result.value.innName).toBe('Paracetamol');
    expect(result.value.atcCode).toBe('N02BE01');
    expect(result.value.form).toBe(MedicationForm.Tablet);
    expect(result.value.strength).toBe('500 mg');
    expect(await medicationRepo.findById(result.value.id)).toBeDefined();
    expect(auditRepo.getEntries()).toHaveLength(1);
    expect(auditRepo.getEntries()[0]?.action).toBe('MedicationCreated');
    expect(auditRepo.getEntries()[0]?.actorId).toBe('admin-1');
  });

  it('fails when the requesting actor is not found', async () => {
    const result = await useCase.execute({ ...validInput, requestingActorId: 'unknown' });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('ActorNotFound');
  });

  it('fails when the requesting actor is not an admin', async () => {
    const result = await useCase.execute({ ...validInput, requestingActorId: 'nurse-1' });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('UnauthorizedRole');
  });

  it('does not persist anything on failure', async () => {
    await useCase.execute({ ...validInput, requestingActorId: 'nurse-1' });

    expect(await medicationRepo.findAll()).toHaveLength(0);
    expect(auditRepo.getEntries()).toHaveLength(0);
  });
});
