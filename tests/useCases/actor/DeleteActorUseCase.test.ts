import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteActorUseCase } from '../../../src/domain/actor/useCases/DeleteActorUseCase';
import { InMemoryActorRepository } from '../../../src/storage/inMemory/InMemoryActorRepository';
import { InMemoryOrderRepository } from '../../../src/storage/inMemory/InMemoryOrderRepository';
import { InMemoryMedicinalProductRepository } from '../../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { InMemoryAuditRepository } from '../../../src/storage/inMemory/InMemoryAuditRepository';
import { InMemoryTransactor } from '../../../src/storage/inMemory/InMemoryTransactor';
import { SimpleEventBus } from '../../../src/eventBus/SimpleEventBus';
import { ActorRole } from '../../../src/domain/shared/ActorRole';

describe('DeleteActorUseCase', () => {
  let actorRepo: InMemoryActorRepository;
  let auditRepo: InMemoryAuditRepository;
  let useCase: DeleteActorUseCase;

  beforeEach(() => {
    actorRepo = new InMemoryActorRepository([
      { id: 'admin-1', role: ActorRole.Admin },
      { id: 'nurse-1', role: ActorRole.Nurse },
      { id: 'nurse-2', role: ActorRole.Nurse },
    ]);
    auditRepo = new InMemoryAuditRepository();
    const transactor = new InMemoryTransactor(
      new InMemoryOrderRepository(),
      new InMemoryMedicinalProductRepository(),
      auditRepo,
      actorRepo,
    );
    useCase = new DeleteActorUseCase(actorRepo, transactor, new SimpleEventBus());
  });

  it('removes the actor and writes an audit entry', async () => {
    const result = await useCase.execute({ requestingActorId: 'admin-1', id: 'nurse-1' });

    expect(result.successful).toBe(true);
    expect(await actorRepo.findById('nurse-1')).toBeUndefined();
    expect(auditRepo.getEntries()).toHaveLength(1);
    expect(auditRepo.getEntries()[0]?.action).toBe('ActorDeleted');
    expect(auditRepo.getEntries()[0]?.actorId).toBe('admin-1');
    expect(auditRepo.getEntries()[0]?.entityId).toBe('nurse-1');
  });

  it('fails when the requesting actor is not found', async () => {
    const result = await useCase.execute({ requestingActorId: 'unknown', id: 'nurse-1' });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('ActorNotFound');
  });

  it('fails when the requesting actor is not an admin', async () => {
    const result = await useCase.execute({ requestingActorId: 'nurse-2', id: 'nurse-1' });

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

  it('fails when an admin tries to delete their own account', async () => {
    const result = await useCase.execute({ requestingActorId: 'admin-1', id: 'admin-1' });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('CannotDeleteSelf');
  });

  it('does not remove the actor or write an audit entry on failure', async () => {
    await useCase.execute({ requestingActorId: 'nurse-2', id: 'nurse-1' });

    expect(await actorRepo.findById('nurse-1')).toBeDefined();
    expect(auditRepo.getEntries()).toHaveLength(0);
  });
});
