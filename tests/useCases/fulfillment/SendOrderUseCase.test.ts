import { describe, it, expect, beforeEach } from 'vitest';
import { CreateOrderUseCase } from '../../../src/domain/order/useCases/ordering/CreateOrderUseCase';
import { SendOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/SendOrderUseCase';
import { InMemoryActorRepository } from '../../../src/storage/inMemory/InMemoryActorRepository';
import { InMemoryOrderRepository } from '../../../src/storage/inMemory/InMemoryOrderRepository';
import { InMemoryMedicinalProductRepository } from '../../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { InMemoryAuditRepository } from '../../../src/storage/inMemory/InMemoryAuditRepository';
import { InMemoryTransactor } from '../../../src/storage/inMemory/InMemoryTransactor';
import { SimpleEventBus } from '../../../src/eventBus/SimpleEventBus';
import { OrderStatus } from '../../../src/domain/order/OrderStatus';
import { ActorRole } from '../../../src/domain/shared/ActorRole';
import { MedicationId, OrderId, WardUnitId } from '../../../src/domain/shared/IdTypes';

describe('SendOrderUseCase', () => {
  let actorRepo: InMemoryActorRepository;
  let orderRepo: InMemoryOrderRepository;
  let auditRepo: InMemoryAuditRepository;
  let eventBus: SimpleEventBus;
  let createOrder: CreateOrderUseCase;
  let sendOrder: SendOrderUseCase;

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
  });

  const createDraftOrder = async () => {
    const result = await createOrder.execute({
      actorId: 'nurse-1',
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }],
    });
    if (!result.successful) throw new Error('Setup failed: could not create order');
    return result.value.id;
  };

  it('advances a draft order to sent', async () => {
    const orderId = await createDraftOrder();

    const result = await sendOrder.execute({ actorId: 'nurse-1', orderId });

    expect(result.successful).toBe(true);
    if (!result.successful) return;
    expect(result.value.status).toBe(OrderStatus.Sent);
  });

  it('writes an audit entry on success', async () => {
    const orderId = await createDraftOrder();
    auditRepo.getEntries(); // clear mental state — one entry already from createOrder

    await sendOrder.execute({ actorId: 'nurse-1', orderId });

    const entries = auditRepo.getEntries();
    const sendEntry = entries.find((e) => e.action === 'OrderSent');
    expect(sendEntry).toBeDefined();
    expect(sendEntry?.actorId).toBe('nurse-1');
  });

  it('fails when the actor is not a nurse', async () => {
    const orderId = await createDraftOrder();

    const result = await sendOrder.execute({ actorId: 'pharmacist-1', orderId });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('UnauthorizedRole');
  });

  it('fails when the actor is not found', async () => {
    const orderId = await createDraftOrder();

    const result = await sendOrder.execute({ actorId: 'unknown', orderId });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('ActorNotFound');
  });

  it('fails when the order does not exist', async () => {
    const result = await sendOrder.execute({
      actorId: 'nurse-1',
      orderId: 'nonexistent' as OrderId,
    });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('OrderNotFound');
  });

  it('fails when the order is not in draft status', async () => {
    const orderId = await createDraftOrder();
    await sendOrder.execute({ actorId: 'nurse-1', orderId });

    const result = await sendOrder.execute({ actorId: 'nurse-1', orderId });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('InvalidStatusTransition');
  });
});
