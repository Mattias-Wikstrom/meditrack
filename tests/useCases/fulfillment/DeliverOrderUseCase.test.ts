import { describe, it, expect, beforeEach } from 'vitest';
import { CreateOrderUseCase } from '../../../src/domain/order/useCases/ordering/CreateOrderUseCase';
import { SendOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/SendOrderUseCase';
import { ConfirmOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/ConfirmOrderUseCase';
import { DeliverOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/DeliverOrderUseCase';
import { InMemoryActorRepository } from '../../../src/storage/inMemory/InMemoryActorRepository';
import { InMemoryOrderRepository } from '../../../src/storage/inMemory/InMemoryOrderRepository';
import { InMemoryMedicinalProductRepository } from '../../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { InMemoryAuditRepository } from '../../../src/storage/inMemory/InMemoryAuditRepository';
import { InMemoryTransactor } from '../../../src/storage/inMemory/InMemoryTransactor';
import { SimpleEventBus } from '../../../src/eventBus/SimpleEventBus';
import { MedicinalProduct } from '../../../src/domain/medication/MedicinalProduct';
import { OrderStatus } from '../../../src/domain/order/OrderStatus';
import { ActorRole } from '../../../src/domain/shared/ActorRole';
import { MedicationId, MedicinalProductId, WardUnitId } from '../../../src/domain/shared/IdTypes';

describe('DeliverOrderUseCase', () => {
  let actorRepo: InMemoryActorRepository;
  let orderRepo: InMemoryOrderRepository;
  let medicinalProductRepo: InMemoryMedicinalProductRepository;
  let auditRepo: InMemoryAuditRepository;
  let eventBus: SimpleEventBus;
  let createOrder: CreateOrderUseCase;
  let sendOrder: SendOrderUseCase;
  let confirmOrder: ConfirmOrderUseCase;
  let deliverOrder: DeliverOrderUseCase;

  beforeEach(async () => {
    actorRepo = new InMemoryActorRepository([
      { id: 'nurse-1', role: ActorRole.Nurse, wardUnitId: 'ward-1' as WardUnitId },
      { id: 'pharmacist-1', role: ActorRole.Pharmacist },
    ]);
    orderRepo = new InMemoryOrderRepository();
    medicinalProductRepo = new InMemoryMedicinalProductRepository();
    auditRepo = new InMemoryAuditRepository();
    const transactor = new InMemoryTransactor(orderRepo, medicinalProductRepo, auditRepo);
    eventBus = new SimpleEventBus();
    createOrder = new CreateOrderUseCase(actorRepo, transactor, eventBus);
    sendOrder = new SendOrderUseCase(actorRepo, orderRepo, transactor, eventBus);
    confirmOrder = new ConfirmOrderUseCase(actorRepo, orderRepo, transactor, eventBus);
    deliverOrder = new DeliverOrderUseCase(actorRepo, orderRepo, medicinalProductRepo, transactor, eventBus);

    await medicinalProductRepo.save(
      new MedicinalProduct('prod-1' as MedicinalProductId, 'Paracetamol 500mg', 'med-1' as MedicationId, 10, 3),
    );
  });

  const createConfirmedOrder = async (medicationId: MedicationId, quantity: number) => {
    const created = await createOrder.execute({
      actorId: 'nurse-1',
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [{ medicationId, quantity }],
    });
    if (!created.successful) throw new Error('Setup failed: could not create order');
    await sendOrder.execute({ actorId: 'nurse-1', orderId: created.value.id });
    await confirmOrder.execute({ actorId: 'pharmacist-1', orderId: created.value.id });
    return created.value.id;
  };

  const selectProd1 = [{ medicationId: 'med-1' as MedicationId, medicinalProductId: 'prod-1' as MedicinalProductId, quantity: 5 }];

  it('sets the order status to delivered', async () => {
    const orderId = await createConfirmedOrder('med-1' as MedicationId, 5);

    const result = await deliverOrder.execute({ actorId: 'pharmacist-1', orderId, productSelections: selectProd1 });

    expect(result.successful).toBe(true);
    expect((await orderRepo.findById(orderId))?.status).toBe(OrderStatus.Delivered);
  });

  it('decreases stock level by the ordered quantity', async () => {
    const orderId = await createConfirmedOrder('med-1' as MedicationId, 5);

    await deliverOrder.execute({ actorId: 'pharmacist-1', orderId, productSelections: selectProd1 });

    expect((await medicinalProductRepo.findByMedicationId('med-1' as MedicationId))[0]?.stockLevel).toBe(5);
  });

  it('writes an audit entry on success', async () => {
    const orderId = await createConfirmedOrder('med-1' as MedicationId, 5);

    await deliverOrder.execute({ actorId: 'pharmacist-1', orderId, productSelections: selectProd1 });

    const deliverEntry = auditRepo.getEntries().find((e) => e.action === 'OrderDelivered');
    expect(deliverEntry).toBeDefined();
    expect(deliverEntry?.actorId).toBe('pharmacist-1');
    expect(deliverEntry?.entityId).toBe(orderId);
  });

  it('fires a StockBelowThreshold event when stock crosses the threshold', async () => {
    const received: string[] = [];
    eventBus.subscribe('StockBelowThreshold', { handle: async (e) => { received.push(e.eventType); } });
    // prod-1: stock 10, threshold 3 — delivering 8 units takes it to 2, crossing the threshold
    const orderId = await createConfirmedOrder('med-1' as MedicationId, 8);

    await deliverOrder.execute({ actorId: 'pharmacist-1', orderId, productSelections: [{ medicationId: 'med-1' as MedicationId, medicinalProductId: 'prod-1' as MedicinalProductId, quantity: 8 }] });

    expect(received).toContain('StockBelowThreshold');
  });

  it('fails when the actor is not a pharmacist', async () => {
    const orderId = await createConfirmedOrder('med-1' as MedicationId, 5);

    const result = await deliverOrder.execute({ actorId: 'nurse-1', orderId, productSelections: selectProd1 });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('UnauthorizedRole');
  });

  it('fails when the actor is not found', async () => {
    const orderId = await createConfirmedOrder('med-1' as MedicationId, 5);

    const result = await deliverOrder.execute({ actorId: 'unknown', orderId, productSelections: selectProd1 });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('ActorNotFound');
  });

  it('fails when order is not in confirmed status', async () => {
    const created = await createOrder.execute({
      actorId: 'nurse-1',
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }],
    });
    if (!created.successful) return;

    const result = await deliverOrder.execute({ actorId: 'pharmacist-1', orderId: created.value.id, productSelections: selectProd1 });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('InvalidStatusTransition');
  });

  it('fails when no product selection is provided for a line', async () => {
    const orderId = await createConfirmedOrder('med-1' as MedicationId, 5);

    const result = await deliverOrder.execute({ actorId: 'pharmacist-1', orderId, productSelections: [] });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('SelectionQuantityMismatch');
  });

  it('does not update stock if delivery fails', async () => {
    const orderId = await createConfirmedOrder('med-1' as MedicationId, 5);
    const stockBefore = (await medicinalProductRepo.findByMedicationId('med-1' as MedicationId))[0]?.stockLevel;

    await deliverOrder.execute({
      actorId: 'pharmacist-1',
      orderId,
      productSelections: [{ medicationId: 'med-1' as MedicationId, medicinalProductId: 'prod-nonexistent' as MedicinalProductId, quantity: 5 }],
    });

    expect((await medicinalProductRepo.findByMedicationId('med-1' as MedicationId))[0]?.stockLevel).toBe(stockBefore);
  });

  it('fails with Conflict when stock changes concurrently between read and write', async () => {
    const orderId = await createConfirmedOrder('med-1' as MedicationId, 5);

    // Simulate a concurrent restock that changes the stock level just before our write commits.
    const conflictTransactor = {
      run: async <T>(work: (tx: any) => Promise<T>) => {
        await medicinalProductRepo.adjustStock('prod-1' as MedicinalProductId, 8, 10);
        return new InMemoryTransactor(orderRepo, medicinalProductRepo, auditRepo).run(work);
      },
    };
    const conflictingDeliver = new DeliverOrderUseCase(actorRepo, orderRepo, medicinalProductRepo, conflictTransactor, eventBus);

    const result = await conflictingDeliver.execute({ actorId: 'pharmacist-1', orderId, productSelections: selectProd1 });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('Conflict');
  });
});
