import { describe, it, expect, beforeEach } from 'vitest';
import { CreateOrderUseCase } from '../../../src/domain/order/useCases/ordering/CreateOrderUseCase';
import { AdvanceOrderStatusUseCase } from '../../../src/domain/order/useCases/fulfillment/AdvanceOrderStatusUseCase';
import { InMemoryOrderRepository } from '../../../src/infrastructure/inMemory/InMemoryOrderRepository';
import { SimpleEventBus } from '../../../src/infrastructure/events/SimpleEventBus';
import { OrderStatus } from '../../../src/domain/order/OrderStatus';

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

  it('advances a draft order to sent', () => {
    const created = createOrder.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1', lines: [{ medicationId: 'med-1', quantity: 5 }] });
    if (!created.successful) return;

    const result = advanceStatus.execute({ actorId: 'pharmacist-1', orderId: created.value.id });

    expect(result.successful).toBe(true);
    if (!result.successful) return;
    expect(result.value.status).toBe(OrderStatus.Sent);
  });

  it('advances a sent order to confirmed', () => {
    const created = createOrder.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1', lines: [{ medicationId: 'med-1', quantity: 5 }] });
    if (!created.successful) return;

    advanceStatus.execute({ actorId: 'pharmacist-1', orderId: created.value.id });
    const result = advanceStatus.execute({ actorId: 'pharmacist-1', orderId: created.value.id });

    expect(result.successful).toBe(true);
    if (!result.successful) return;
    expect(result.value.status).toBe(OrderStatus.Confirmed);
  });

  it('fails when the order does not exist', () => {
    const result = advanceStatus.execute({ actorId: 'pharmacist-1', orderId: 'nonexistent-id' });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.ruleName).toBe('OrderNotFound');
  });

  it('fails when the order is already confirmed (delivery is a separate step)', () => {
    const created = createOrder.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1', lines: [{ medicationId: 'med-1', quantity: 5 }] });
    if (!created.successful) return;

    advanceStatus.execute({ actorId: 'pharmacist-1', orderId: created.value.id }); // Draft → Sent
    advanceStatus.execute({ actorId: 'pharmacist-1', orderId: created.value.id }); // Sent → Confirmed
    const result = advanceStatus.execute({ actorId: 'pharmacist-1', orderId: created.value.id });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.ruleName).toBe('InvalidStatusTransition');
  });
});
