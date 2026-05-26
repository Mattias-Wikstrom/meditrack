import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteWardUnitUseCase } from '../../../src/domain/wardUnit/useCases/DeleteWardUnitUseCase';
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

describe('DeleteWardUnitUseCase', () => {
  let actorRepo: InMemoryActorRepository;
  let wardUnitRepo: InMemoryWardUnitRepository;
  let auditRepo: InMemoryAuditRepository;
  let useCase: DeleteWardUnitUseCase;

  beforeEach(() => {
    actorRepo = new InMemoryActorRepository([
      { id: 'admin-1', role: ActorRole.Admin },
      { id: 'nurse-1', role: ActorRole.Nurse, wardUnitId: 'ward-occupied' },
      { id: 'nurse-2', role: ActorRole.Nurse, wardUnitId: 'ward-occupied' },
    ]);
    wardUnitRepo = new InMemoryWardUnitRepository();
    wardUnitRepo.save(new WardUnit('ward-empty' as WardUnitId, 'Empty Ward'));
    wardUnitRepo.save(new WardUnit('ward-occupied' as WardUnitId, 'Occupied Ward'));
    auditRepo = new InMemoryAuditRepository();
    const transactor = new InMemoryTransactor(
      new InMemoryOrderRepository(),
      new InMemoryMedicinalProductRepository(),
      auditRepo,
      actorRepo,
      wardUnitRepo,
    );
    useCase = new DeleteWardUnitUseCase(wardUnitRepo, actorRepo, transactor, new SimpleEventBus());
  });

  it('removes the ward unit and writes an audit entry', async () => {
    const result = await useCase.execute({ requestingActorId: 'admin-1', id: 'ward-empty' });

    expect(result.successful).toBe(true);
    expect(await wardUnitRepo.findById('ward-empty' as WardUnitId)).toBeUndefined();
    expect(auditRepo.getEntries()).toHaveLength(1);
    expect(auditRepo.getEntries()[0]?.action).toBe('WardUnitDeleted');
    expect(auditRepo.getEntries()[0]?.actorId).toBe('admin-1');
    expect(auditRepo.getEntries()[0]?.entityId).toBe('ward-empty');
  });

  it('fails when nurses are assigned to the ward unit', async () => {
    const result = await useCase.execute({ requestingActorId: 'admin-1', id: 'ward-occupied' });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('WardUnitHasAssignedNurses');
  });

  it('does not remove the ward unit or write an audit entry when nurses are assigned', async () => {
    await useCase.execute({ requestingActorId: 'admin-1', id: 'ward-occupied' });

    expect(await wardUnitRepo.findById('ward-occupied' as WardUnitId)).toBeDefined();
    expect(auditRepo.getEntries()).toHaveLength(0);
  });

  it('fails when the requesting actor is not found', async () => {
    const result = await useCase.execute({ requestingActorId: 'unknown', id: 'ward-empty' });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('ActorNotFound');
  });

  it('fails when the requesting actor is not an admin', async () => {
    const result = await useCase.execute({ requestingActorId: 'nurse-1', id: 'ward-empty' });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('UnauthorizedRole');
  });

  it('fails when the ward unit is not found', async () => {
    const result = await useCase.execute({ requestingActorId: 'admin-1', id: 'unknown' });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('WardUnitNotFound');
  });
});
