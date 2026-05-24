import { describe, it, expect, beforeEach } from 'vitest';
import { CreateOrderUseCase } from '../../../src/domain/order/useCases/ordering/CreateOrderUseCase';
import { AdvanceOrderStatusUseCase } from '../../../src/domain/order/useCases/fulfillment/AdvanceOrderStatusUseCase';
import { DeliverOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/DeliverOrderUseCase';
import { InMemoryOrderRepository } from '../../../src/storage/inMemory/InMemoryOrderRepository';
import { InMemoryMedicinalProductRepository } from '../../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { SimpleEventBus } from '../../../src/eventBus/SimpleEventBus';
import { AuditListener } from '../../../src/audit/AuditListener';
import Decimal from 'decimal.js';
import { MedicinalProduct } from '../../../src/domain/medication/MedicinalProduct';
import { MedicationId, MedicinalProductId, WardUnitId } from '../../../src/domain/shared/IdTypes';

describe('AuditListener', () => {
  let eventBus: SimpleEventBus;
  let auditListener: AuditListener;
  let orderRepo: InMemoryOrderRepository;
  let medicinalProductRepo: InMemoryMedicinalProductRepository;
  let createOrder: CreateOrderUseCase;
  let advanceStatus: AdvanceOrderStatusUseCase;
  let deliverOrder: DeliverOrderUseCase;

  beforeEach(() => {
    eventBus = new SimpleEventBus();
    auditListener = new AuditListener();
    orderRepo = new InMemoryOrderRepository();
    medicinalProductRepo = new InMemoryMedicinalProductRepository();
    createOrder = new CreateOrderUseCase(orderRepo, eventBus);
    advanceStatus = new AdvanceOrderStatusUseCase(orderRepo, eventBus);
    deliverOrder = new DeliverOrderUseCase(orderRepo, medicinalProductRepo, eventBus);

    eventBus.subscribe('OrderPlaced', auditListener);
    eventBus.subscribe('OrderStatusAdvanced', auditListener);
    eventBus.subscribe('OrderDelivered', auditListener);
    eventBus.subscribe('StockBelowThreshold', auditListener);

    medicinalProductRepo.save(
      new MedicinalProduct('prod-1' as MedicinalProductId, 'Paracetamol 500mg', 'med-1' as MedicationId, new Decimal(10), new Decimal(20)),
    );
  });

  it('records an entry when an order is placed', () => {
    createOrder.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1' as WardUnitId, lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }] });

    const entries = auditListener.getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.eventType).toBe('OrderPlaced');
    expect(entries[0]?.actorId).toBe('nurse-1');
  });

  it('distinguishes the actor for each action', () => {
    const created = createOrder.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1' as WardUnitId, lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }] });
    if (!created.successful) return;

    advanceStatus.execute({ actorId: 'pharmacist-1', orderId: created.value.id });

    const entries = auditListener.getEntries();
    expect(entries).toHaveLength(2);
    expect(entries[0]?.actorId).toBe('nurse-1');
    expect(entries[1]?.actorId).toBe('pharmacist-1');
  });

  it('does not record failed operations', () => {
    createOrder.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1' as WardUnitId, lines: [] });

    expect(auditListener.getEntries()).toHaveLength(0);
  });

  it('records a StockBelowThreshold event when stock drops below threshold after delivery', () => {
    const created = createOrder.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1' as WardUnitId, lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }] });
    if (!created.successful) return;

    advanceStatus.execute({ actorId: 'pharmacist-1', orderId: created.value.id });
    advanceStatus.execute({ actorId: 'pharmacist-1', orderId: created.value.id });

    // stock starts at 10, threshold is 20 — already below threshold before delivery
    deliverOrder.execute({ actorId: 'pharmacist-1', orderId: created.value.id });

    const eventTypes = auditListener.getEntries().map((e) => e.eventType);
    expect(eventTypes).toContain('StockBelowThreshold');
    expect(eventTypes).toContain('OrderDelivered');
  });
});
