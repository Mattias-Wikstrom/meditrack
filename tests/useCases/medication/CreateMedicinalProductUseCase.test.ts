import { describe, it, expect, beforeEach } from 'vitest';
import { CreateMedicinalProductUseCase } from '../../../src/domain/medication/useCases/CreateMedicinalProductUseCase';
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

describe('CreateMedicinalProductUseCase', () => {
  let medicationRepo: InMemoryMedicationRepository;
  let productRepo: InMemoryMedicinalProductRepository;
  let actorRepo: InMemoryActorRepository;
  let auditRepo: InMemoryAuditRepository;
  let useCase: CreateMedicinalProductUseCase;

  const validInput = {
    requestingActorId: 'admin-1',
    medicationId: MED_ID,
    productName: 'Alvedon 500 mg',
    stockLevel: 200,
    stockThreshold: 50,
  };

  beforeEach(async () => {
    actorRepo = new InMemoryActorRepository([
      { id: 'admin-1', role: ActorRole.Admin },
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
    useCase = new CreateMedicinalProductUseCase(productRepo, medicationRepo, actorRepo, transactor);
  });

  it('saves the product and writes an audit entry', async () => {
    const result = await useCase.execute(validInput);

    expect(result.successful).toBe(true);
    if (!result.successful) return;
    expect(result.value.productName).toBe('Alvedon 500 mg');
    expect(result.value.medicationId).toBe(MED_ID);
    expect(result.value.stockLevel).toBe(200);
    expect(result.value.stockThreshold).toBe(50);
    expect(await productRepo.findById(result.value.id)).toBeDefined();
    expect(auditRepo.getEntries()[0]?.action).toBe('MedicinalProductCreated');
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

  it('fails when the medication does not exist', async () => {
    const result = await useCase.execute({ ...validInput, medicationId: 'no-such-med' as MedicationId });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('MedicationNotFound');
  });
});
