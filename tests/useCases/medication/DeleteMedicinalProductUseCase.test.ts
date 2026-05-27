import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteMedicinalProductUseCase } from '../../../src/domain/medication/useCases/DeleteMedicinalProductUseCase';
import { InMemoryMedicinalProductRepository } from '../../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { InMemoryActorRepository } from '../../../src/storage/inMemory/InMemoryActorRepository';
import { InMemoryAuditRepository } from '../../../src/storage/inMemory/InMemoryAuditRepository';
import { InMemoryOrderRepository } from '../../../src/storage/inMemory/InMemoryOrderRepository';
import { InMemoryTransactor } from '../../../src/storage/inMemory/InMemoryTransactor';
import { ActorRole } from '../../../src/domain/shared/ActorRole';
import { MedicinalProduct } from '../../../src/domain/medication/MedicinalProduct';
import { MedicationId, MedicinalProductId } from '../../../src/domain/shared/IdTypes';

const MED_ID = 'med-001' as MedicationId;
const PROD_ID = 'prod-001' as MedicinalProductId;

describe('DeleteMedicinalProductUseCase', () => {
  let productRepo: InMemoryMedicinalProductRepository;
  let actorRepo: InMemoryActorRepository;
  let auditRepo: InMemoryAuditRepository;
  let useCase: DeleteMedicinalProductUseCase;

  beforeEach(async () => {
    actorRepo = new InMemoryActorRepository([
      { id: 'admin-1', role: ActorRole.Admin },
      { id: 'nurse-1', role: ActorRole.Nurse },
    ]);
    productRepo = new InMemoryMedicinalProductRepository();
    await productRepo.save(new MedicinalProduct(PROD_ID, 'Alvedon 500 mg', MED_ID, 200, 50));
    auditRepo = new InMemoryAuditRepository();
    const transactor = new InMemoryTransactor(
      new InMemoryOrderRepository(),
      productRepo,
      auditRepo,
      actorRepo,
    );
    useCase = new DeleteMedicinalProductUseCase(productRepo, actorRepo, transactor);
  });

  it('deletes the product and writes an audit entry', async () => {
    const result = await useCase.execute({ requestingActorId: 'admin-1', id: PROD_ID });

    expect(result.successful).toBe(true);
    expect(await productRepo.findById(PROD_ID)).toBeUndefined();
    expect(auditRepo.getEntries()[0]?.action).toBe('MedicinalProductDeleted');
    expect(auditRepo.getEntries()[0]?.entityId).toBe(PROD_ID);
  });

  it('fails when the requesting actor is not found', async () => {
    const result = await useCase.execute({ requestingActorId: 'unknown', id: PROD_ID });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('ActorNotFound');
  });

  it('fails when the requesting actor is not an admin', async () => {
    const result = await useCase.execute({ requestingActorId: 'nurse-1', id: PROD_ID });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('UnauthorizedRole');
  });

  it('fails when the product does not exist', async () => {
    const result = await useCase.execute({ requestingActorId: 'admin-1', id: 'no-such-prod' as MedicinalProductId });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('MedicinalProductNotFound');
  });

  it('does not write an audit entry on failure', async () => {
    await useCase.execute({ requestingActorId: 'nurse-1', id: PROD_ID });

    expect(auditRepo.getEntries()).toHaveLength(0);
    expect(await productRepo.findById(PROD_ID)).toBeDefined();
  });
});
