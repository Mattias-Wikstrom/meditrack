import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateActorUseCase } from '../../../src/domain/actor/useCases/UpdateActorUseCase';
import { InMemoryActorRepository } from '../../../src/storage/inMemory/InMemoryActorRepository';
import { InMemoryOrderRepository } from '../../../src/storage/inMemory/InMemoryOrderRepository';
import { InMemoryMedicinalProductRepository } from '../../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { InMemoryAuditRepository } from '../../../src/storage/inMemory/InMemoryAuditRepository';
import { InMemoryTransactor } from '../../../src/storage/inMemory/InMemoryTransactor';
import { SimpleEventBus } from '../../../src/eventBus/SimpleEventBus';
import { ActorRole } from '../../../src/domain/shared/ActorRole';

describe('UpdateActorUseCase', () => {
  let actorRepo: InMemoryActorRepository;
  let auditRepo: InMemoryAuditRepository;
  let useCase: UpdateActorUseCase;

  beforeEach(() => {
    actorRepo = new InMemoryActorRepository([
      { id: 'admin-1', role: ActorRole.Admin },
      { id: 'nurse-1', role: ActorRole.Nurse, wardUnitId: 'ward-1' },
      { id: 'nurse-2', role: ActorRole.Nurse },
    ]);
    auditRepo = new InMemoryAuditRepository();
    const transactor = new InMemoryTransactor(
      new InMemoryOrderRepository(),
      new InMemoryMedicinalProductRepository(),
      auditRepo,
      actorRepo,
    );
    useCase = new UpdateActorUseCase(actorRepo, transactor, new SimpleEventBus());
  });

  it('updates the actor role and writes an audit entry', async () => {
    const result = await useCase.execute({
      requestingActorId: 'admin-1',
      id: 'nurse-1',
      role: ActorRole.Pharmacist,
    });

    expect(result.successful).toBe(true);
    if (!result.successful) return;
    expect(result.value.role).toBe(ActorRole.Pharmacist);
    expect((await actorRepo.findById('nurse-1'))?.role).toBe(ActorRole.Pharmacist);
    expect(auditRepo.getEntries()[0]?.action).toBe('ActorUpdated');
    expect(auditRepo.getEntries()[0]?.actorId).toBe('admin-1');
    expect(auditRepo.getEntries()[0]?.entityId).toBe('nurse-1');
  });

  it('clears ward unit when role changes away from Nurse', async () => {
    const result = await useCase.execute({
      requestingActorId: 'admin-1',
      id: 'nurse-1',
      role: ActorRole.Pharmacist,
    });

    expect(result.successful).toBe(true);
    if (!result.successful) return;
    expect(result.value.wardUnitId).toBeUndefined();
  });

  it('preserves ward unit when role stays Nurse and wardUnitId is omitted', async () => {
    const result = await useCase.execute({
      requestingActorId: 'admin-1',
      id: 'nurse-1',
    });

    expect(result.successful).toBe(true);
    if (!result.successful) return;
    expect(result.value.wardUnitId).toBe('ward-1');
  });

  it('clears ward unit when null is explicitly passed', async () => {
    const result = await useCase.execute({
      requestingActorId: 'admin-1',
      id: 'nurse-1',
      wardUnitId: null,
    });

    expect(result.successful).toBe(true);
    if (!result.successful) return;
    expect(result.value.wardUnitId).toBeUndefined();
  });

  it('assigns a ward unit to a nurse', async () => {
    const result = await useCase.execute({
      requestingActorId: 'admin-1',
      id: 'nurse-2',
      wardUnitId: 'ward-2',
    });

    expect(result.successful).toBe(true);
    if (!result.successful) return;
    expect(result.value.wardUnitId).toBe('ward-2');
  });

  it('fails when the requesting actor is not found', async () => {
    const result = await useCase.execute({ requestingActorId: 'unknown', id: 'nurse-1' });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('ActorNotFound');
  });

  it('fails when the requesting actor is not an admin', async () => {
    const result = await useCase.execute({
      requestingActorId: 'nurse-2',
      id: 'nurse-1',
      role: ActorRole.Pharmacist,
    });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('UnauthorizedRole');
  });

  it('fails when the target actor is not found', async () => {
    const result = await useCase.execute({ requestingActorId: 'admin-1', id: 'unknown' });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('ActorNotFound');
  });

  it('fails when a non-nurse is assigned a ward unit', async () => {
    const result = await useCase.execute({
      requestingActorId: 'admin-1',
      id: 'nurse-1',
      role: ActorRole.Pharmacist,
      wardUnitId: 'ward-2',
    });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('WardUnitAssignmentNotAllowed');
  });
});
