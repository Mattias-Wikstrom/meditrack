import { describe, it, expect, beforeEach } from 'vitest';
import { CreateOrderUseCase } from '../../../src/domain/order/useCases/ordering/CreateOrderUseCase';
import { AdvanceOrderStatusUseCase } from '../../../src/domain/order/useCases/fulfillment/AdvanceOrderStatusUseCase';
import { DeliverOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/DeliverOrderUseCase';
import { InMemoryOrderRepository } from '../../../src/storage/inMemory/InMemoryOrderRepository';
import { InMemoryMedicinalProductRepository } from '../../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { SimpleEventBus } from '../../../src/eventBus/SimpleEventBus';
import Decimal from 'decimal.js';
import { MedicinalProduct } from '../../../src/domain/medication/MedicinalProduct';
import { OrderStatus } from '../../../src/domain/order/OrderStatus';
import { MedicationId, MedicinalProductId, WardUnitId } from '../../../src/domain/shared/IdTypes';

describe('DeliverOrderUseCase', () => {
  let orderRepo: InMemoryOrderRepository;
  let medicinalProductRepo: InMemoryMedicinalProductRepository;
  let eventBus: SimpleEventBus;
  let createOrder: CreateOrderUseCase;
  let advanceStatus: AdvanceOrderStatusUseCase;
  let deliverOrder: DeliverOrderUseCase;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    medicinalProductRepo = new InMemoryMedicinalProductRepository();
    eventBus = new SimpleEventBus();
    createOrder = new CreateOrderUseCase(orderRepo, eventBus);
    advanceStatus = new AdvanceOrderStatusUseCase(orderRepo, eventBus);
    deliverOrder = new DeliverOrderUseCase(orderRepo, medicinalProductRepo, eventBus);

    medicinalProductRepo.save(
      new MedicinalProduct('prod-1' as MedicinalProductId, 'Paracetamol 500mg', 'med-1' as MedicationId, new Decimal(10), new Decimal(20)),
    );
  });

  const createConfirmedOrder = (medicationId: MedicationId, quantity: number) => {
    const created = createOrder.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1' as WardUnitId, lines: [{ medicationId, quantity }] });
    if (!created.successful) throw new Error('Setup failed: could not create order');
    advanceStatus.execute({ actorId: 'pharmacist-1', orderId: created.value.id });
    advanceStatus.execute({ actorId: 'pharmacist-1', orderId: created.value.id });
    return created.value.id;
  };

  it('sets the order status to delivered', () => {
    const orderId = createConfirmedOrder('med-1' as MedicationId, 5);

    const result = deliverOrder.execute({ actorId: 'pharmacist-1', orderId });

    expect(result.successful).toBe(true);
    expect(orderRepo.findById(orderId)?.status).toBe(OrderStatus.Delivered);
  });

  it('increases stock level by the ordered quantity', () => {
    const orderId = createConfirmedOrder('med-1' as MedicationId, 5);

    deliverOrder.execute({ actorId: 'pharmacist-1', orderId });

    expect(medicinalProductRepo.findByMedicationId('med-1' as MedicationId)[0]?.stockLevel.toNumber()).toBe(15);
  });

  it('fails when order is not in confirmed status', () => {
    const created = createOrder.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1' as WardUnitId, lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }] });
    if (!created.successful) return;

    const result = deliverOrder.execute({ actorId: 'pharmacist-1', orderId: created.value.id });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('InvalidStatusTransition');
  });

  it('fails when no medicinal product exists for the medication', () => {
    const orderId = createConfirmedOrder('med-unknown' as MedicationId, 5);

    const result = deliverOrder.execute({ actorId: 'pharmacist-1', orderId });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('MedicinalProductNotFound');
  });

  it('does not update stock if delivery fails', () => {
    const orderId = createConfirmedOrder('med-unknown' as MedicationId, 5);
    const stockBefore = medicinalProductRepo.findByMedicationId('med-1' as MedicationId)[0]?.stockLevel.toNumber();

    deliverOrder.execute({ actorId: 'pharmacist-1', orderId });

    expect(medicinalProductRepo.findByMedicationId('med-1' as MedicationId)[0]?.stockLevel.toNumber()).toBe(stockBefore);
  });
});
