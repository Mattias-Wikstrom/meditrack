import { describe, it, expect, beforeEach } from 'vitest';
import { CreateOrderUseCase } from '../../../src/domain/order/useCases/ordering/CreateOrderUseCase';
import { InMemoryOrderRepository } from '../../../src/infrastructure/inMemory/InMemoryOrderRepository';
import { SimpleEventBus } from '../../../src/infrastructure/events/SimpleEventBus';
import { OrderStatus } from '../../../src/domain/order/OrderStatus';

describe('CreateOrderUseCase', () => {
  let orderRepo: InMemoryOrderRepository;
  let useCase: CreateOrderUseCase;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    useCase = new CreateOrderUseCase(orderRepo, new SimpleEventBus());
  });

  it('creates a draft order and persists it', () => {
    const result = useCase.execute({
      actorId: 'nurse-1',
      wardUnitId: 'ward-1',
      lines: [{ medicationId: 'med-1', quantity: 5 }],
    });

    expect(result.successful).toBe(true);
    if (!result.successful) return;

    expect(result.value.status).toBe(OrderStatus.Draft);
    expect(orderRepo.findById(result.value.id)).toBeDefined();
  });

  it('fails and does not persist when there are no lines', () => {
    const result = useCase.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1', lines: [] });

    expect(result.successful).toBe(false);
    if (result.successful) return;

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.ruleName).toBe('OrderHasAtLeastOneLine');
    expect(orderRepo.findAll()).toHaveLength(0);
  });

  it('fails when a line has a non-positive quantity', () => {
    const result = useCase.execute({
      actorId: 'nurse-1',
      wardUnitId: 'ward-1',
      lines: [{ medicationId: 'med-1', quantity: 0 }],
    });

    expect(result.successful).toBe(false);
    if (result.successful) return;

    expect(result.errors[0]?.ruleName).toBe('OrderLineQuantitiesPositive');
  });
});
