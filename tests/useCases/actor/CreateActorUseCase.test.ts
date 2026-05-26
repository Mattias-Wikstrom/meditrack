import { describe, it, expect, beforeEach } from 'vitest';
import { CreateActorUseCase } from '../../../src/domain/actor/useCases/CreateActorUseCase';
import { InMemoryActorRepository } from '../../../src/storage/inMemory/InMemoryActorRepository';
import { InMemoryCredentialsRepository } from '../../../src/storage/inMemory/InMemoryCredentialsRepository';
import { InMemoryOrderRepository } from '../../../src/storage/inMemory/InMemoryOrderRepository';
import { InMemoryMedicinalProductRepository } from '../../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { InMemoryAuditRepository } from '../../../src/storage/inMemory/InMemoryAuditRepository';
import { InMemoryTransactor } from '../../../src/storage/inMemory/InMemoryTransactor';
import { SimpleEventBus } from '../../../src/eventBus/SimpleEventBus';
import { ActorRole } from '../../../src/domain/shared/ActorRole';

describe('CreateActorUseCase', () => {
  let actorRepo: InMemoryActorRepository;
  let credentialsRepo: InMemoryCredentialsRepository;
  let auditRepo: InMemoryAuditRepository;
  let useCase: CreateActorUseCase;

  beforeEach(() => {
    actorRepo = new InMemoryActorRepository([
      { id: 'admin-1', role: ActorRole.Admin },
      { id: 'nurse-existing', role: ActorRole.Nurse },
    ]);
    credentialsRepo = new InMemoryCredentialsRepository(actorRepo);
    auditRepo = new InMemoryAuditRepository();
    const transactor = new InMemoryTransactor(
      new InMemoryOrderRepository(),
      new InMemoryMedicinalProductRepository(),
      auditRepo,
      actorRepo,
    );
    useCase = new CreateActorUseCase(actorRepo, credentialsRepo, transactor, new SimpleEventBus());
  });

  it('saves the actor and writes an audit entry', async () => {
    const result = await useCase.execute({
      requestingActorId: 'admin-1',
      id: 'nurse-1',
      role: ActorRole.Nurse,
      wardUnitId: 'ward-1',
      password: 'secret',
    });

    expect(result.successful).toBe(true);
    if (!result.successful) return;
    expect(result.value.role).toBe(ActorRole.Nurse);
    expect(result.value.wardUnitId).toBe('ward-1');
    expect(await actorRepo.findById('nurse-1')).toBeDefined();
    expect(auditRepo.getEntries()).toHaveLength(1);
    expect(auditRepo.getEntries()[0]?.action).toBe('ActorCreated');
    expect(auditRepo.getEntries()[0]?.actorId).toBe('admin-1');
    expect(auditRepo.getEntries()[0]?.entityId).toBe('nurse-1');
  });

  it('stores a password hash for the new actor', async () => {
    await useCase.execute({
      requestingActorId: 'admin-1',
      id: 'nurse-1',
      role: ActorRole.Nurse,
      password: 'secret',
    });

    const creds = await credentialsRepo.findByActorId('nurse-1');
    expect(creds).toBeDefined();
    expect(creds?.passwordHash).toBeDefined();
  });

  it('fails when the requesting actor is not found', async () => {
    const result = await useCase.execute({
      requestingActorId: 'unknown',
      id: 'nurse-1',
      role: ActorRole.Nurse,
      password: 'secret',
    });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('ActorNotFound');
  });

  it('fails when the requesting actor is not an admin', async () => {
    const result = await useCase.execute({
      requestingActorId: 'nurse-existing',
      id: 'nurse-1',
      role: ActorRole.Nurse,
      password: 'secret',
    });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('UnauthorizedRole');
  });

  it('fails when a non-nurse is assigned a ward unit', async () => {
    const result = await useCase.execute({
      requestingActorId: 'admin-1',
      id: 'pharma-1',
      role: ActorRole.Pharmacist,
      wardUnitId: 'ward-1',
      password: 'secret',
    });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('WardUnitAssignmentNotAllowed');
  });

  it('does not persist the actor or audit entry on failure', async () => {
    await useCase.execute({
      requestingActorId: 'admin-1',
      id: 'pharma-1',
      role: ActorRole.Pharmacist,
      wardUnitId: 'ward-1',
      password: 'secret',
    });

    expect(await actorRepo.findById('pharma-1')).toBeUndefined();
    expect(auditRepo.getEntries()).toHaveLength(0);
  });
});
