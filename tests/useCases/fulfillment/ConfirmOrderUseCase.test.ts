import { describe, it, expect, beforeEach } from 'vitest';
import { CreateOrderUseCase } from '../../../src/domain/order/useCases/ordering/CreateOrderUseCase';
import { SendOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/SendOrderUseCase';
import { ConfirmOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/ConfirmOrderUseCase';
import { InMemoryActorRepository } from '../../../src/storage/inMemory/InMemoryActorRepository';
import { InMemoryOrderRepository } from '../../../src/storage/inMemory/InMemoryOrderRepository';
import { InMemoryMedicinalProductRepository } from '../../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { InMemoryAuditRepository } from '../../../src/storage/inMemory/InMemoryAuditRepository';
import { InMemoryTransactor } from '../../../src/storage/inMemory/InMemoryTransactor';
import { SimpleEventBus } from '../../../src/eventBus/SimpleEventBus';
import { OrderStatus } from '../../../src/domain/order/OrderStatus';
import { ActorRole } from '../../../src/domain/shared/ActorRole';
import { MedicationId, OrderId, WardUnitId } from '../../../src/domain/shared/IdTypes';

describe('ConfirmOrderUseCase', () => {
  let actorRepo: InMemoryActorRepository;
  let orderRepo: InMemoryOrderRepository;
  let auditRepo: InMemoryAuditRepository;
  let eventBus: SimpleEventBus;
  let createOrder: CreateOrderUseCase;
  let sendOrder: SendOrderUseCase;
  let confirmOrder: ConfirmOrderUseCase;

  beforeEach(() => {
    actorRepo = new InMemoryActorRepository([
      { id: 'nurse-1', role: ActorRole.Nurse, wardUnitId: 'ward-1' as WardUnitId },
      { id: 'pharmacist-1', role: ActorRole.Pharmacist },
    ]);
    orderRepo = new InMemoryOrderRepository();
    auditRepo = new InMemoryAuditRepository();
    const transactor = new InMemoryTransactor(orderRepo, new InMemoryMedicinalProductRepository(), auditRepo);
    eventBus = new SimpleEventBus();
    createOrder = new CreateOrderUseCase(actorRepo, transactor, eventBus);
    sendOrder = new SendOrderUseCase(actorRepo, orderRepo, transactor, eventBus);
    confirmOrder = new ConfirmOrderUseCase(actorRepo, orderRepo, transactor, eventBus);
  });

  const createSentOrder = async () => {
    const result = await createOrder.execute({
      actorId: 'nurse-1',
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }],
    });
    if (!result.successful) throw new Error('Setup failed: could not create order');
    await sendOrder.execute({ actorId: 'nurse-1', orderId: result.value.id });
    return result.value.id;
  };

  it('advances a sent order to confirmed', async () => {
    const orderId = await createSentOrder();

    const result = await confirmOrder.execute({ actorId: 'pharmacist-1', orderId });

    expect(result.successful).toBe(true);
    if (!result.successful) return;
    expect(result.value.status).toBe(OrderStatus.Confirmed);
  });

  it('writes an audit entry on success', async () => {
    const orderId = await createSentOrder();

    await confirmOrder.execute({ actorId: 'pharmacist-1', orderId });

    const entries = auditRepo.getEntries();
    const confirmEntry = entries.find((e) => e.action === 'OrderConfirmed');
    expect(confirmEntry).toBeDefined();
    expect(confirmEntry?.actorId).toBe('pharmacist-1');
  });

  it('fails when the actor is not a pharmacist', async () => {
    const orderId = await createSentOrder();

    const result = await confirmOrder.execute({ actorId: 'nurse-1', orderId });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('UnauthorizedRole');
  });

  it('fails when the actor is not found', async () => {
    const orderId = await createSentOrder();

    const result = await confirmOrder.execute({ actorId: 'unknown', orderId });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('ActorNotFound');
  });

  it('fails when the order does not exist', async () => {
    const result = await confirmOrder.execute({
      actorId: 'pharmacist-1',
      orderId: 'nonexistent' as OrderId,
    });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('OrderNotFound');
  });

  it('fails when the order is not in sent status', async () => {
    const result = await createOrder.execute({
      actorId: 'nurse-1',
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }],
    });
    if (!result.successful) return;

    const confirmResult = await confirmOrder.execute({
      actorId: 'pharmacist-1',
      orderId: result.value.id,
    });

    expect(confirmResult.successful).toBe(false);
    if (confirmResult.successful) return;
    expect(confirmResult.errors[0]?.code).toBe('InvalidStatusTransition');
  });
});
