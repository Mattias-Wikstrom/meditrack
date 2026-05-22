import { describe, it, expect, beforeEach } from 'vitest';
import { CreateOrderUseCase } from '../../../src/domain/order/useCases/ordering/CreateOrderUseCase';
import { AdvanceOrderStatusUseCase } from '../../../src/domain/order/useCases/fulfillment/AdvanceOrderStatusUseCase';
import { DeliverOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/DeliverOrderUseCase';
import { InMemoryOrderRepository } from '../../../src/infrastructure/inMemory/InMemoryOrderRepository';
import { InMemoryMedicationRepository } from '../../../src/infrastructure/inMemory/InMemoryMedicationRepository';
import { SimpleEventBus } from '../../../src/infrastructure/events/SimpleEventBus';
import { AuditListener } from '../../../src/infrastructure/audit/AuditListener';
import { Medication } from '../../../src/domain/medication/Medication';
import { MedicationForm } from '../../../src/domain/medication/MedicationForm';

describe('AuditListener', () => {
  let eventBus: SimpleEventBus;
  let auditListener: AuditListener;
  let orderRepo: InMemoryOrderRepository;
  let medicationRepo: InMemoryMedicationRepository;
  let createOrder: CreateOrderUseCase;
  let advanceStatus: AdvanceOrderStatusUseCase;
  let deliverOrder: DeliverOrderUseCase;

  beforeEach(() => {
    eventBus = new SimpleEventBus();
    auditListener = new AuditListener();
    orderRepo = new InMemoryOrderRepository();
    medicationRepo = new InMemoryMedicationRepository();
    createOrder = new CreateOrderUseCase(orderRepo, eventBus);
    advanceStatus = new AdvanceOrderStatusUseCase(orderRepo, eventBus);
    deliverOrder = new DeliverOrderUseCase(orderRepo, medicationRepo, eventBus);

    eventBus.subscribe('OrderPlaced', auditListener);
    eventBus.subscribe('OrderStatusAdvanced', auditListener);
    eventBus.subscribe('OrderDelivered', auditListener);
    eventBus.subscribe('StockBelowThreshold', auditListener);

    medicationRepo.save(
      new Medication('med-1', 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg', 10, 20),
    );
  });

  it('records an entry when an order is placed', () => {
    createOrder.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1', lines: [{ medicationId: 'med-1', quantity: 5 }] });

    const entries = auditListener.getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.eventType).toBe('OrderPlaced');
    expect(entries[0]?.actorId).toBe('nurse-1');
  });

  it('distinguishes the actor for each action', () => {
    const created = createOrder.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1', lines: [{ medicationId: 'med-1', quantity: 5 }] });
    if (!created.successful) return;

    advanceStatus.execute({ actorId: 'pharmacist-1', orderId: created.value.id });

    const entries = auditListener.getEntries();
    expect(entries).toHaveLength(2);
    expect(entries[0]?.actorId).toBe('nurse-1');
    expect(entries[1]?.actorId).toBe('pharmacist-1');
  });

  it('does not record failed operations', () => {
    createOrder.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1', lines: [] });

    expect(auditListener.getEntries()).toHaveLength(0);
  });

  it('records a StockBelowThreshold event when stock drops below threshold after delivery', () => {
    const created = createOrder.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1', lines: [{ medicationId: 'med-1', quantity: 5 }] });
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
