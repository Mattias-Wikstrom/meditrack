import { describe, it, expect, beforeEach } from 'vitest';
import { CreateOrderUseCase } from '../../../src/domain/order/useCases/ordering/CreateOrderUseCase';
import { SendOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/SendOrderUseCase';
import { InMemoryOrderRepository } from '../../../src/storage/inMemory/InMemoryOrderRepository';
import { SimpleEventBus } from '../../../src/eventBus/SimpleEventBus';
import { OrderStatus } from '../../../src/domain/order/OrderStatus';
import { ActorRole } from '../../../src/domain/shared/ActorRole';
import { MedicationId, OrderId, WardUnitId } from '../../../src/domain/shared/IdTypes';

describe('SendOrderUseCase', () => {
  let orderRepo: InMemoryOrderRepository;
  let eventBus: SimpleEventBus;
  let createOrder: CreateOrderUseCase;
  let sendOrder: SendOrderUseCase;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    eventBus = new SimpleEventBus();
    createOrder = new CreateOrderUseCase(orderRepo, eventBus);
    sendOrder = new SendOrderUseCase(orderRepo, eventBus);
  });

  const createDraftOrder = async () => {
    const result = await createOrder.execute({
      actorId: 'nurse-1',
      actorRole: ActorRole.Nurse,
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }],
    });
    if (!result.successful) throw new Error('Setup failed: could not create order');
    return result.value.id;
  };

  it('advances a draft order to sent', async () => {
    const orderId = await createDraftOrder();

    const result = await sendOrder.execute({ actorId: 'nurse-1', actorRole: ActorRole.Nurse, orderId });

    expect(result.successful).toBe(true);
    if (!result.successful) return;
    expect(result.value.status).toBe(OrderStatus.Sent);
  });

  it('fails when the actor is not a nurse', async () => {
    const orderId = await createDraftOrder();

    const result = await sendOrder.execute({ actorId: 'pharmacist-1', actorRole: ActorRole.Pharmacist, orderId });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('UnauthorizedRole');
  });

  it('fails when the order does not exist', async () => {
    const result = await sendOrder.execute({
      actorId: 'nurse-1',
      actorRole: ActorRole.Nurse,
      orderId: 'nonexistent' as OrderId,
    });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('OrderNotFound');
  });

  it('fails when the order is not in draft status', async () => {
    const orderId = await createDraftOrder();
    await sendOrder.execute({ actorId: 'nurse-1', actorRole: ActorRole.Nurse, orderId });

    const result = await sendOrder.execute({ actorId: 'nurse-1', actorRole: ActorRole.Nurse, orderId });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('InvalidStatusTransition');
  });
});
