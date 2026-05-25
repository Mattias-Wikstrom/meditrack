import { describe, it, expect, beforeEach } from 'vitest';
import { CreateOrderUseCase } from '../../../src/domain/order/useCases/ordering/CreateOrderUseCase';
import { InMemoryActorRepository } from '../../../src/storage/inMemory/InMemoryActorRepository';
import { InMemoryOrderRepository } from '../../../src/storage/inMemory/InMemoryOrderRepository';
import { InMemoryMedicinalProductRepository } from '../../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { InMemoryAuditRepository } from '../../../src/storage/inMemory/InMemoryAuditRepository';
import { InMemoryTransactor } from '../../../src/storage/inMemory/InMemoryTransactor';
import { SimpleEventBus } from '../../../src/eventBus/SimpleEventBus';
import { OrderStatus } from '../../../src/domain/order/OrderStatus';
import { ActorRole } from '../../../src/domain/shared/ActorRole';
import { MedicationId, WardUnitId } from '../../../src/domain/shared/IdTypes';

describe('CreateOrderUseCase', () => {
  let actorRepo: InMemoryActorRepository;
  let orderRepo: InMemoryOrderRepository;
  let auditRepo: InMemoryAuditRepository;
  let useCase: CreateOrderUseCase;

  beforeEach(() => {
    actorRepo = new InMemoryActorRepository([
      { id: 'nurse-1', role: ActorRole.Nurse },
      { id: 'pharmacist-1', role: ActorRole.Pharmacist },
    ]);
    orderRepo = new InMemoryOrderRepository();
    auditRepo = new InMemoryAuditRepository();
    const transactor = new InMemoryTransactor(orderRepo, new InMemoryMedicinalProductRepository(), auditRepo);
    useCase = new CreateOrderUseCase(actorRepo, transactor, new SimpleEventBus());
  });

  it('creates a draft order and persists it', async () => {
    const result = await useCase.execute({
      actorId: 'nurse-1',
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }],
    });

    expect(result.successful).toBe(true);
    if (!result.successful) return;
    expect(result.value.status).toBe(OrderStatus.Draft);
    expect(await orderRepo.findById(result.value.id)).toBeDefined();
  });

  it('writes an audit entry on success', async () => {
    const result = await useCase.execute({
      actorId: 'nurse-1',
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }],
    });
    if (!result.successful) return;

    expect(auditRepo.getEntries()).toHaveLength(1);
    expect(auditRepo.getEntries()[0]?.action).toBe('DraftOrderCreated');
    expect(auditRepo.getEntries()[0]?.actorId).toBe('nurse-1');
    expect(auditRepo.getEntries()[0]?.entityId).toBe(result.value.id);
  });

  it('fails when the actor is not a nurse', async () => {
    const result = await useCase.execute({
      actorId: 'pharmacist-1',
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }],
    });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('UnauthorizedRole');
  });

  it('fails when the actor is not found', async () => {
    const result = await useCase.execute({
      actorId: 'unknown',
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }],
    });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('ActorNotFound');
  });

  it('fails and does not persist when there are no lines', async () => {
    const result = await useCase.execute({
      actorId: 'nurse-1',
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [],
    });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('OrderHasAtLeastOneLine');
    expect(await orderRepo.findAll()).toHaveLength(0);
    expect(auditRepo.getEntries()).toHaveLength(0);
  });

  it('fails when a line has a non-positive quantity', async () => {
    const result = await useCase.execute({
      actorId: 'nurse-1',
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [{ medicationId: 'med-1' as MedicationId, quantity: 0 }],
    });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('OrderLineQuantitiesPositive');
  });
});
