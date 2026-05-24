import { describe, it, expect, beforeEach } from 'vitest';
import { CreateOrderUseCase } from '../../../src/domain/order/useCases/ordering/CreateOrderUseCase';
import { AdvanceOrderStatusUseCase } from '../../../src/domain/order/useCases/fulfillment/AdvanceOrderStatusUseCase';
import { InMemoryOrderRepository } from '../../../src/storage/inMemory/InMemoryOrderRepository';
import { SimpleEventBus } from '../../../src/eventBus/SimpleEventBus';
import { OrderStatus } from '../../../src/domain/order/OrderStatus';
import { MedicationId, OrderId, WardUnitId } from '../../../src/domain/shared/IdTypes';

describe('AdvanceOrderStatusUseCase', () => {
  let orderRepo: InMemoryOrderRepository;
  let eventBus: SimpleEventBus;
  let createOrder: CreateOrderUseCase;
  let advanceStatus: AdvanceOrderStatusUseCase;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    eventBus = new SimpleEventBus();
    createOrder = new CreateOrderUseCase(orderRepo, eventBus);
    advanceStatus = new AdvanceOrderStatusUseCase(orderRepo, eventBus);
  });

  it('advances a draft order to sent', async () => {
    const created = await createOrder.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1' as WardUnitId, lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }] });
    if (!created.successful) return;

    const result = await advanceStatus.execute({ actorId: 'pharmacist-1', orderId: created.value.id });

    expect(result.successful).toBe(true);
    if (!result.successful) return;
    expect(result.value.status).toBe(OrderStatus.Sent);
  });

  it('advances a sent order to confirmed', async () => {
    const created = await createOrder.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1' as WardUnitId, lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }] });
    if (!created.successful) return;

    await advanceStatus.execute({ actorId: 'pharmacist-1', orderId: created.value.id });
    const result = await advanceStatus.execute({ actorId: 'pharmacist-1', orderId: created.value.id });

    expect(result.successful).toBe(true);
    if (!result.successful) return;
    expect(result.value.status).toBe(OrderStatus.Confirmed);
  });

  it('fails when the order does not exist', async () => {
    const result = await advanceStatus.execute({ actorId: 'pharmacist-1', orderId: 'nonexistent-id' as OrderId });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('OrderNotFound');
  });

  it('fails when the order is already confirmed (delivery is a separate step)', async () => {
    const created = await createOrder.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1' as WardUnitId, lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }] });
    if (!created.successful) return;

    await advanceStatus.execute({ actorId: 'pharmacist-1', orderId: created.value.id }); // Draft → Sent
    await advanceStatus.execute({ actorId: 'pharmacist-1', orderId: created.value.id }); // Sent → Confirmed
    const result = await advanceStatus.execute({ actorId: 'pharmacist-1', orderId: created.value.id });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('InvalidStatusTransition');
  });
});
