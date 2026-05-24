import { describe, it, expect, beforeEach } from 'vitest';
import { CreateOrderUseCase } from '../../../src/domain/order/useCases/ordering/CreateOrderUseCase';
import { SendOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/SendOrderUseCase';
import { ConfirmOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/ConfirmOrderUseCase';
import { InMemoryOrderRepository } from '../../../src/storage/inMemory/InMemoryOrderRepository';
import { SimpleEventBus } from '../../../src/eventBus/SimpleEventBus';
import { OrderStatus } from '../../../src/domain/order/OrderStatus';
import { ActorRole } from '../../../src/domain/shared/ActorRole';
import { MedicationId, OrderId, WardUnitId } from '../../../src/domain/shared/IdTypes';

describe('ConfirmOrderUseCase', () => {
  let orderRepo: InMemoryOrderRepository;
  let eventBus: SimpleEventBus;
  let createOrder: CreateOrderUseCase;
  let sendOrder: SendOrderUseCase;
  let confirmOrder: ConfirmOrderUseCase;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    eventBus = new SimpleEventBus();
    createOrder = new CreateOrderUseCase(orderRepo, eventBus);
    sendOrder = new SendOrderUseCase(orderRepo, eventBus);
    confirmOrder = new ConfirmOrderUseCase(orderRepo, eventBus);
  });

  const createSentOrder = async () => {
    const result = await createOrder.execute({
      actorId: 'nurse-1',
      actorRole: ActorRole.Nurse,
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }],
    });
    if (!result.successful) throw new Error('Setup failed: could not create order');
    await sendOrder.execute({ actorId: 'nurse-1', actorRole: ActorRole.Nurse, orderId: result.value.id });
    return result.value.id;
  };

  it('advances a sent order to confirmed', async () => {
    const orderId = await createSentOrder();

    const result = await confirmOrder.execute({ actorId: 'pharmacist-1', actorRole: ActorRole.Pharmacist, orderId });

    expect(result.successful).toBe(true);
    if (!result.successful) return;
    expect(result.value.status).toBe(OrderStatus.Confirmed);
  });

  it('fails when the actor is not a pharmacist', async () => {
    const orderId = await createSentOrder();

    const result = await confirmOrder.execute({ actorId: 'nurse-1', actorRole: ActorRole.Nurse, orderId });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('UnauthorizedRole');
  });

  it('fails when the order does not exist', async () => {
    const result = await confirmOrder.execute({
      actorId: 'pharmacist-1',
      actorRole: ActorRole.Pharmacist,
      orderId: 'nonexistent' as OrderId,
    });

    expect(result.successful).toBe(false);
    if (result.successful) return;
    expect(result.errors[0]?.code).toBe('OrderNotFound');
  });

  it('fails when the order is not in sent status', async () => {
    const result = await createOrder.execute({
      actorId: 'nurse-1',
      actorRole: ActorRole.Nurse,
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }],
    });
    if (!result.successful) return;

    const confirmResult = await confirmOrder.execute({
      actorId: 'pharmacist-1',
      actorRole: ActorRole.Pharmacist,
      orderId: result.value.id,
    });

    expect(confirmResult.successful).toBe(false);
    if (confirmResult.successful) return;
    expect(confirmResult.errors[0]?.code).toBe('InvalidStatusTransition');
  });
});
