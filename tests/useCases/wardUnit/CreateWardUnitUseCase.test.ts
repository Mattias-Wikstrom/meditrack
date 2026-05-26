import { describe, it, expect, beforeEach } from 'vitest';
import { CreateWardUnitUseCase } from '../../../src/domain/wardUnit/useCases/CreateWardUnitUseCase';
import { InMemoryActorRepository } from '../../../src/storage/inMemory/InMemoryActorRepository';
import { InMemoryWardUnitRepository } from '../../../src/storage/inMemory/InMemoryWardUnitRepository';
import { InMemoryOrderRepository } from '../../../src/storage/inMemory/InMemoryOrderRepository';
import { InMemoryMedicinalProductRepository } from '../../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { InMemoryAuditRepository } from '../../../src/storage/inMemory/InMemoryAuditRepository';
import { InMemoryTransactor } from '../../../src/storage/inMemory/InMemoryTransactor';
import { SimpleEventBus } from '../../../src/eventBus/SimpleEventBus';
import { ActorRole } from '../../../src/domain/shared/ActorRole';
import { WardUnit } from '../../../src/domain/wardUnit/WardUnit';
import { WardUnitId } from '../../../src/domain/shared/IdTypes';

describe('CreateWardUnitUseCase', () => {
  let actorRepo: InMemoryActorRepository;
  let wardUnitRepo: InMemoryWardUnitRepository;
  let auditRepo: InMemoryAuditRepository;
  let useCase: CreateWardUnitUseCase;

  beforeEach(() => {
    actorRepo = new InMemoryActorRepository([
      { id: 'admin-1', role: ActorRole.Admin },
      { id: 'nurse-1', role: ActorRole.Nurse },
    ]);
    wardUnitRepo = new InMemoryWardUnitRepository();
    wardUnitRepo.save(new WardUnit('ward-existing' as WardUnitId, 'Existing Ward'));
    auditRepo = new InMemoryAuditRepository();
    const transactor = new InMemoryTransactor(
      new InMemoryOrderRepository(),
      new InMemoryMedicinalProductRepository(),
      auditRepo,
      actorRepo,
      wardUnitRepo,
    );
    useCase = new CreateWardUnitUseCase(wardUnitRepo, actorRepo, transactor, new SimpleEventBus());
  });

  it('saves the ward unit and writes an audit entry', async () => {
    const result = await useCase.execute({
      requestingActorId: 'admin-1',
      id: 'ward-4b',
      name: 'Ward 4B',
    });

    expect(result.successful).toBe(true);
    if (!result.successful) return;
    expect(result.value.id).toBe('ward-4b');
    expect(result.value.name).toBe('Ward 4B');
    expect(await wardUnitRepo.findById('ward-4b' as WardUnitId)).toBeDefined();
    expect(auditRepo.getEntries()).toHaveLength(1);
    expect(auditRepo.getEntries()[0]?.action).toBe('WardUnitCreated');
    expect(auditRepo.getEntries()[0]?.actorId).toBe('admin-1');
    expect(auditRepo.getEntries()[0]?.entityId).toBe('ward-4b');
  });

  it('fails when the requesting actor is not found', async () => {
    const result = await useCase.execute({ requestingActorId: 'unknown', id: 'ward-4b', name: 'Ward 4B' });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('ActorNotFound');
  });

  it('fails when the requesting actor is not an admin', async () => {
    const result = await useCase.execute({ requestingActorId: 'nurse-1', id: 'ward-4b', name: 'Ward 4B' });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('UnauthorizedRole');
  });

  it('fails when a ward unit with that ID already exists', async () => {
    const result = await useCase.execute({ requestingActorId: 'admin-1', id: 'ward-existing', name: 'Duplicate' });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('WardUnitAlreadyExists');
  });

  it('does not persist the ward unit or audit entry on failure', async () => {
    await useCase.execute({ requestingActorId: 'nurse-1', id: 'ward-4b', name: 'Ward 4B' });

    expect(await wardUnitRepo.findById('ward-4b' as WardUnitId)).toBeUndefined();
    expect(auditRepo.getEntries()).toHaveLength(0);
  });
});
