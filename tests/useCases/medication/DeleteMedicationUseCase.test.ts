import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteMedicationUseCase } from '../../../src/domain/medication/useCases/DeleteMedicationUseCase';
import { InMemoryMedicationRepository } from '../../../src/storage/inMemory/InMemoryMedicationRepository';
import { InMemoryMedicinalProductRepository } from '../../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { InMemoryActorRepository } from '../../../src/storage/inMemory/InMemoryActorRepository';
import { InMemoryAuditRepository } from '../../../src/storage/inMemory/InMemoryAuditRepository';
import { InMemoryOrderRepository } from '../../../src/storage/inMemory/InMemoryOrderRepository';
import { InMemoryTransactor } from '../../../src/storage/inMemory/InMemoryTransactor';
import { ActorRole } from '../../../src/domain/shared/ActorRole';
import { MedicationForm } from '../../../src/domain/medication/MedicationForm';
import { Medication } from '../../../src/domain/medication/Medication';
import { MedicinalProduct } from '../../../src/domain/medication/MedicinalProduct';
import { MedicationId, MedicinalProductId } from '../../../src/domain/shared/IdTypes';

const MED_ID = 'med-001' as MedicationId;

describe('DeleteMedicationUseCase', () => {
  let medicationRepo: InMemoryMedicationRepository;
  let productRepo: InMemoryMedicinalProductRepository;
  let actorRepo: InMemoryActorRepository;
  let auditRepo: InMemoryAuditRepository;
  let useCase: DeleteMedicationUseCase;

  beforeEach(async () => {
    actorRepo = new InMemoryActorRepository([
      { id: 'pharm-1', role: ActorRole.Pharmacist },
      { id: 'nurse-1', role: ActorRole.Nurse },
    ]);
    medicationRepo = new InMemoryMedicationRepository();
    await medicationRepo.save(new Medication(MED_ID, 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500 mg'));
    productRepo = new InMemoryMedicinalProductRepository();
    auditRepo = new InMemoryAuditRepository();
    const transactor = new InMemoryTransactor(
      new InMemoryOrderRepository(),
      productRepo,
      auditRepo,
      actorRepo,
      undefined,
      medicationRepo,
    );
    useCase = new DeleteMedicationUseCase(medicationRepo, productRepo, actorRepo, transactor);
  });

  it('deletes the medication and writes an audit entry', async () => {
    const result = await useCase.execute({ requestingActorId: 'pharm-1', id: MED_ID });

    expect(result.successful).toBe(true);
    expect(await medicationRepo.findById(MED_ID)).toBeUndefined();
    expect(auditRepo.getEntries()[0]?.action).toBe('MedicationDeleted');
    expect(auditRepo.getEntries()[0]?.entityId).toBe(MED_ID);
  });

  it('fails when the requesting actor is not found', async () => {
    const result = await useCase.execute({ requestingActorId: 'unknown', id: MED_ID });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('ActorNotFound');
  });

  it('fails when the requesting actor is not a pharmacist', async () => {
    const result = await useCase.execute({ requestingActorId: 'nurse-1', id: MED_ID });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('UnauthorizedRole');
  });

  it('fails when the medication does not exist', async () => {
    const result = await useCase.execute({ requestingActorId: 'pharm-1', id: 'no-such-med' as MedicationId });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('MedicationNotFound');
  });

  it('fails when the medication still has products', async () => {
    await productRepo.save(new MedicinalProduct('prod-1' as MedicinalProductId, 'Alvedon', MED_ID, 100, 20));

    const result = await useCase.execute({ requestingActorId: 'pharm-1', id: MED_ID });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('MedicationHasProducts');
    expect(await medicationRepo.findById(MED_ID)).toBeDefined();
  });

  it('does not write an audit entry on failure', async () => {
    await useCase.execute({ requestingActorId: 'nurse-1', id: MED_ID });

    expect(auditRepo.getEntries()).toHaveLength(0);
  });
});
