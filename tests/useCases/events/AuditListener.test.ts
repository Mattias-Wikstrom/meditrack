import { describe, it, expect, beforeEach } from 'vitest';
import { CreateOrderUseCase } from '../../../src/domain/order/useCases/ordering/CreateOrderUseCase';
import { SendOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/SendOrderUseCase';
import { ConfirmOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/ConfirmOrderUseCase';
import { DeliverOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/DeliverOrderUseCase';
import { InMemoryActorRepository } from '../../../src/storage/inMemory/InMemoryActorRepository';
import { InMemoryOrderRepository } from '../../../src/storage/inMemory/InMemoryOrderRepository';
import { InMemoryMedicinalProductRepository } from '../../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { SimpleEventBus } from '../../../src/eventBus/SimpleEventBus';
import { AuditListener } from '../../../src/audit/AuditListener';
import Decimal from 'decimal.js';
import { MedicinalProduct } from '../../../src/domain/medication/MedicinalProduct';
import { ActorRole } from '../../../src/domain/shared/ActorRole';
import { MedicationId, MedicinalProductId, WardUnitId } from '../../../src/domain/shared/IdTypes';

describe('AuditListener', () => {
  let eventBus: SimpleEventBus;
  let auditListener: AuditListener;
  let actorRepo: InMemoryActorRepository;
  let orderRepo: InMemoryOrderRepository;
  let medicinalProductRepo: InMemoryMedicinalProductRepository;
  let createOrder: CreateOrderUseCase;
  let sendOrder: SendOrderUseCase;
  let confirmOrder: ConfirmOrderUseCase;
  let deliverOrder: DeliverOrderUseCase;

  beforeEach(async () => {
    eventBus = new SimpleEventBus();
    auditListener = new AuditListener();
    actorRepo = new InMemoryActorRepository([
      { id: 'nurse-1', role: ActorRole.Nurse },
      { id: 'pharmacist-1', role: ActorRole.Pharmacist },
    ]);
    orderRepo = new InMemoryOrderRepository();
    medicinalProductRepo = new InMemoryMedicinalProductRepository();
    createOrder = new CreateOrderUseCase(actorRepo, orderRepo, eventBus);
    sendOrder = new SendOrderUseCase(actorRepo, orderRepo, eventBus);
    confirmOrder = new ConfirmOrderUseCase(actorRepo, orderRepo, eventBus);
    deliverOrder = new DeliverOrderUseCase(actorRepo, orderRepo, medicinalProductRepo, eventBus);

    eventBus.subscribe('OrderPlaced', auditListener);
    eventBus.subscribe('OrderStatusAdvanced', auditListener);
    eventBus.subscribe('OrderDelivered', auditListener);
    eventBus.subscribe('StockBelowThreshold', auditListener);

    await medicinalProductRepo.save(
      new MedicinalProduct('prod-1' as MedicinalProductId, 'Paracetamol 500mg', 'med-1' as MedicationId, new Decimal(10), new Decimal(6)),
    );
  });

  it('records an entry when an order is placed', async () => {
    await createOrder.execute({
      actorId: 'nurse-1',
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }],
    });

    const entries = auditListener.getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.eventType).toBe('OrderPlaced');
    expect(entries[0]?.actorId).toBe('nurse-1');
  });

  it('distinguishes the actor for each action', async () => {
    const created = await createOrder.execute({
      actorId: 'nurse-1',
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }],
    });
    if (!created.successful) return;

    await sendOrder.execute({ actorId: 'nurse-1', orderId: created.value.id });

    const entries = auditListener.getEntries();
    expect(entries).toHaveLength(2);
    expect(entries[0]?.actorId).toBe('nurse-1');
    expect(entries[1]?.actorId).toBe('nurse-1');
  });

  it('does not record failed operations', async () => {
    await createOrder.execute({
      actorId: 'nurse-1',
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [],
    });

    expect(auditListener.getEntries()).toHaveLength(0);
  });

  it('records a StockBelowThreshold event when stock crosses the threshold after delivery', async () => {
    const created = await createOrder.execute({
      actorId: 'nurse-1',
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }],
    });
    if (!created.successful) return;

    await sendOrder.execute({ actorId: 'nurse-1', orderId: created.value.id });
    await confirmOrder.execute({ actorId: 'pharmacist-1', orderId: created.value.id });

    // stock starts at 10, threshold is 6 — delivery of 5 units takes it to 5, crossing the threshold
    await deliverOrder.execute({
      actorId: 'pharmacist-1',
      orderId: created.value.id,
      productSelections: [{ medicationId: 'med-1' as MedicationId, medicinalProductId: 'prod-1' as MedicinalProductId, quantity: 5 }],
    });

    const eventTypes = auditListener.getEntries().map((e) => e.eventType);
    expect(eventTypes).toContain('StockBelowThreshold');
    expect(eventTypes).toContain('OrderDelivered');
  });
});
