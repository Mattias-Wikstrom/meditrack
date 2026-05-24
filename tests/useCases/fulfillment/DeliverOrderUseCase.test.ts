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

  beforeEach(async () => {
    orderRepo = new InMemoryOrderRepository();
    medicinalProductRepo = new InMemoryMedicinalProductRepository();
    eventBus = new SimpleEventBus();
    createOrder = new CreateOrderUseCase(orderRepo, eventBus);
    advanceStatus = new AdvanceOrderStatusUseCase(orderRepo, eventBus);
    deliverOrder = new DeliverOrderUseCase(orderRepo, medicinalProductRepo, eventBus);

    await medicinalProductRepo.save(
      new MedicinalProduct('prod-1' as MedicinalProductId, 'Paracetamol 500mg', 'med-1' as MedicationId, new Decimal(10), new Decimal(20)),
    );
  });

  const createConfirmedOrder = async (medicationId: MedicationId, quantity: number) => {
    const created = await createOrder.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1' as WardUnitId, lines: [{ medicationId, quantity }] });
    if (!created.successful) throw new Error('Setup failed: could not create order');
    await advanceStatus.execute({ actorId: 'pharmacist-1', orderId: created.value.id });
    await advanceStatus.execute({ actorId: 'pharmacist-1', orderId: created.value.id });
    return created.value.id;
  };

  it('sets the order status to delivered', async () => {
    const orderId = await createConfirmedOrder('med-1' as MedicationId, 5);

    const result = await deliverOrder.execute({ actorId: 'pharmacist-1', orderId });

    expect(result.successful).toBe(true);
    expect((await orderRepo.findById(orderId))?.status).toBe(OrderStatus.Delivered);
  });

  it('increases stock level by the ordered quantity', async () => {
    const orderId = await createConfirmedOrder('med-1' as MedicationId, 5);

    await deliverOrder.execute({ actorId: 'pharmacist-1', orderId });

    expect((await medicinalProductRepo.findByMedicationId('med-1' as MedicationId))[0]?.stockLevel.toNumber()).toBe(15);
  });

  it('fails when order is not in confirmed status', async () => {
    const created = await createOrder.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1' as WardUnitId, lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }] });
    if (!created.successful) return;

    const result = await deliverOrder.execute({ actorId: 'pharmacist-1', orderId: created.value.id });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('InvalidStatusTransition');
  });

  it('fails when no medicinal product exists for the medication', async () => {
    const orderId = await createConfirmedOrder('med-unknown' as MedicationId, 5);

    const result = await deliverOrder.execute({ actorId: 'pharmacist-1', orderId });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('MedicinalProductNotFound');
  });

  it('does not update stock if delivery fails', async () => {
    const orderId = await createConfirmedOrder('med-unknown' as MedicationId, 5);
    const stockBefore = (await medicinalProductRepo.findByMedicationId('med-1' as MedicationId))[0]?.stockLevel.toNumber();

    await deliverOrder.execute({ actorId: 'pharmacist-1', orderId });

    expect((await medicinalProductRepo.findByMedicationId('med-1' as MedicationId))[0]?.stockLevel.toNumber()).toBe(stockBefore);
  });
});
