import { describe, it, expect, beforeEach } from 'vitest';
import { listOrders, createOrder, advanceOrder, deliverOrder } from '../../../src/ui/cli/commands/orders';
import { InMemoryOrderRepository } from '../../../src/storage/inMemory/InMemoryOrderRepository';
import { InMemoryMedicinalProductRepository } from '../../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { SimpleEventBus } from '../../../src/eventBus/SimpleEventBus';
import { CreateOrderUseCase } from '../../../src/domain/order/useCases/ordering/CreateOrderUseCase';
import { AdvanceOrderStatusUseCase } from '../../../src/domain/order/useCases/fulfillment/AdvanceOrderStatusUseCase';
import { DeliverOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/DeliverOrderUseCase';
import { MedicinalProduct } from '../../../src/domain/medication/MedicinalProduct';
import { MedicationId, MedicinalProductId, WardUnitId } from '../../../src/domain/shared/IdTypes';
import Decimal from 'decimal.js';
import { RecordingOutput, ExitError } from './RecordingOutput';

describe('listOrders', () => {
  it('prints a message when there are no orders', async () => {
    const output = new RecordingOutput();

    await listOrders(new InMemoryOrderRepository(), output);

    expect(output.messages).toEqual(['No orders.']);
  });

  it('prints one line per order', async () => {
    const repo = new InMemoryOrderRepository();
    const useCase = new CreateOrderUseCase(repo, new SimpleEventBus());
    await useCase.execute({ actorId: 'cli', wardUnitId: 'ward-1' as WardUnitId, lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }] });
    await useCase.execute({ actorId: 'cli', wardUnitId: 'ward-1' as WardUnitId, lines: [{ medicationId: 'med-2' as MedicationId, quantity: 3 }] });
    const output = new RecordingOutput();

    await listOrders(repo, output);

    expect(output.messages).toHaveLength(2);
  });
});

describe('createOrder', () => {
  it('prints the created order ID on success', async () => {
    const repo = new InMemoryOrderRepository();
    const useCase = new CreateOrderUseCase(repo, new SimpleEventBus());
    const output = new RecordingOutput();

    await createOrder(useCase, output, 'ward-1', 'med-1', 5);

    expect(output.messages).toHaveLength(1);
    expect(output.messages[0]).toContain('created');
  });

  it('exits with code 1 and prints an error on validation failure', async () => {
    const useCase = new CreateOrderUseCase(new InMemoryOrderRepository(), new SimpleEventBus());
    const output = new RecordingOutput();

    await expect(createOrder(useCase, output, 'ward-1', 'med-1', 0)).rejects.toThrow(ExitError);
    expect(output.errors[0]).toContain('OrderLineQuantitiesPositive');
  });
});

describe('advanceOrder', () => {
  it('prints the new status on success', async () => {
    const repo = new InMemoryOrderRepository();
    const eventBus = new SimpleEventBus();
    const created = await new CreateOrderUseCase(repo, eventBus).execute({ actorId: 'cli', wardUnitId: 'ward-1' as WardUnitId, lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }] });
    if (!created.successful) throw new Error('setup failed');
    const useCase = new AdvanceOrderStatusUseCase(repo, eventBus);
    const output = new RecordingOutput();

    await advanceOrder(useCase, output, created.value.id);

    expect(output.messages[0]).toContain('Sent');
  });

  it('exits with code 1 for an unknown order', async () => {
    const useCase = new AdvanceOrderStatusUseCase(new InMemoryOrderRepository(), new SimpleEventBus());
    const output = new RecordingOutput();

    await expect(advanceOrder(useCase, output, 'no-such-order')).rejects.toThrow(ExitError);
    expect(output.errors[0]).toContain('OrderNotFound');
  });
});

describe('deliverOrder', () => {
  it('prints a confirmation on success', async () => {
    const orderRepo = new InMemoryOrderRepository();
    const medicinalProductRepo = new InMemoryMedicinalProductRepository();
    const eventBus = new SimpleEventBus();
    await medicinalProductRepo.save(new MedicinalProduct('prod-1' as MedicinalProductId, 'Paracetamol 500mg', 'med-1' as MedicationId, new Decimal(10), new Decimal(5)));
    const created = await new CreateOrderUseCase(orderRepo, eventBus).execute({ actorId: 'cli', wardUnitId: 'ward-1' as WardUnitId, lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }] });
    if (!created.successful) throw new Error('setup failed');
    await new AdvanceOrderStatusUseCase(orderRepo, eventBus).execute({ actorId: 'cli', orderId: created.value.id });
    await new AdvanceOrderStatusUseCase(orderRepo, eventBus).execute({ actorId: 'cli', orderId: created.value.id });
    const useCase = new DeliverOrderUseCase(orderRepo, medicinalProductRepo, eventBus);
    const output = new RecordingOutput();

    await deliverOrder(useCase, output, created.value.id, [{ medicationId: 'med-1', medicinalProductId: 'prod-1', quantity: 5 }]);

    expect(output.messages[0]).toContain('delivered');
  });
});
