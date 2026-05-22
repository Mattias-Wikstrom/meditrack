import { describe, it, expect, beforeEach } from 'vitest';
import { CreateOrderUseCase } from '../../../src/domain/order/useCases/ordering/CreateOrderUseCase';
import { AdvanceOrderStatusUseCase } from '../../../src/domain/order/useCases/fulfillment/AdvanceOrderStatusUseCase';
import { DeliverOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/DeliverOrderUseCase';
import { InMemoryOrderRepository } from '../../../src/infrastructure/inMemory/InMemoryOrderRepository';
import { InMemoryMedicationRepository } from '../../../src/infrastructure/inMemory/InMemoryMedicationRepository';
import { SimpleEventBus } from '../../../src/infrastructure/events/SimpleEventBus';
import { Medication } from '../../../src/domain/medication/Medication';
import { MedicationForm } from '../../../src/domain/medication/MedicationForm';
import { OrderStatus } from '../../../src/domain/order/OrderStatus';

describe('DeliverOrderUseCase', () => {
  let orderRepo: InMemoryOrderRepository;
  let medicationRepo: InMemoryMedicationRepository;
  let eventBus: SimpleEventBus;
  let createOrder: CreateOrderUseCase;
  let advanceStatus: AdvanceOrderStatusUseCase;
  let deliverOrder: DeliverOrderUseCase;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    medicationRepo = new InMemoryMedicationRepository();
    eventBus = new SimpleEventBus();
    createOrder = new CreateOrderUseCase(orderRepo, eventBus);
    advanceStatus = new AdvanceOrderStatusUseCase(orderRepo, eventBus);
    deliverOrder = new DeliverOrderUseCase(orderRepo, medicationRepo, eventBus);

    medicationRepo.save(
      new Medication('med-1', 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg', 10, 20),
    );
  });

  const createConfirmedOrder = (medicationId: string, quantity: number): string => {
    const created = createOrder.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1', lines: [{ medicationId, quantity }] });
    if (!created.successful) throw new Error('Setup failed: could not create order');
    advanceStatus.execute({ actorId: 'pharmacist-1', orderId: created.value.id });
    advanceStatus.execute({ actorId: 'pharmacist-1', orderId: created.value.id });
    return created.value.id;
  };

  it('sets the order status to delivered', () => {
    const orderId = createConfirmedOrder('med-1', 5);

    const result = deliverOrder.execute({ actorId: 'pharmacist-1', orderId });

    expect(result.successful).toBe(true);
    expect(orderRepo.findById(orderId)?.status).toBe(OrderStatus.Delivered);
  });

  it('increases medication stock level by the ordered quantity', () => {
    const orderId = createConfirmedOrder('med-1', 5);

    deliverOrder.execute({ actorId: 'pharmacist-1', orderId });

    expect(medicationRepo.findById('med-1')?.stockLevel).toBe(15);
  });

  it('fails when order is not in confirmed status', () => {
    const created = createOrder.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1', lines: [{ medicationId: 'med-1', quantity: 5 }] });
    if (!created.successful) return;

    const result = deliverOrder.execute({ actorId: 'pharmacist-1', orderId: created.value.id });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.ruleName).toBe('InvalidStatusTransition');
  });

  it('fails when a medication in the order does not exist', () => {
    const orderId = createConfirmedOrder('med-unknown', 5);

    const result = deliverOrder.execute({ actorId: 'pharmacist-1', orderId });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.ruleName).toBe('MedicationNotFound');
  });

  it('does not update stock if delivery fails', () => {
    const orderId = createConfirmedOrder('med-unknown', 5);
    const stockBefore = medicationRepo.findById('med-1')?.stockLevel;

    deliverOrder.execute({ actorId: 'pharmacist-1', orderId });

    expect(medicationRepo.findById('med-1')?.stockLevel).toBe(stockBefore);
  });
});
