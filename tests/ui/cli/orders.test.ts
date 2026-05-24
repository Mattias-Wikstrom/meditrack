import { describe, it, expect, beforeEach } from 'vitest';
import { listOrders, createOrder, sendOrder, confirmOrder, deliverOrder } from '../../../src/ui/cli/commands/orders';
import { InMemoryActorRepository } from '../../../src/storage/inMemory/InMemoryActorRepository';
import { InMemoryOrderRepository } from '../../../src/storage/inMemory/InMemoryOrderRepository';
import { InMemoryMedicinalProductRepository } from '../../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { SimpleEventBus } from '../../../src/eventBus/SimpleEventBus';
import { CreateOrderUseCase } from '../../../src/domain/order/useCases/ordering/CreateOrderUseCase';
import { SendOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/SendOrderUseCase';
import { ConfirmOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/ConfirmOrderUseCase';
import { DeliverOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/DeliverOrderUseCase';
import { MedicinalProduct } from '../../../src/domain/medication/MedicinalProduct';
import { ActorRole } from '../../../src/domain/shared/ActorRole';
import { MedicationId, MedicinalProductId, WardUnitId } from '../../../src/domain/shared/IdTypes';
import Decimal from 'decimal.js';
import { RecordingOutput, ExitError } from './RecordingOutput';

// The CLI commands use 'cli-nurse' and 'cli-pharmacist' as actor IDs
const cliActorRepo = () =>
  new InMemoryActorRepository([
    { id: 'cli-nurse', role: ActorRole.Nurse },
    { id: 'cli-pharmacist', role: ActorRole.Pharmacist },
  ]);

describe('listOrders', () => {
  it('prints a message when there are no orders', async () => {
    const output = new RecordingOutput();

    await listOrders(new InMemoryOrderRepository(), output);

    expect(output.messages).toEqual(['No orders.']);
  });

  it('prints one line per order', async () => {
    const repo = new InMemoryOrderRepository();
    const actorRepo = cliActorRepo();
    const useCase = new CreateOrderUseCase(actorRepo, repo, new SimpleEventBus());
    await useCase.execute({ actorId: 'cli-nurse', wardUnitId: 'ward-1' as WardUnitId, lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }] });
    await useCase.execute({ actorId: 'cli-nurse', wardUnitId: 'ward-1' as WardUnitId, lines: [{ medicationId: 'med-2' as MedicationId, quantity: 3 }] });
    const output = new RecordingOutput();

    await listOrders(repo, output);

    expect(output.messages).toHaveLength(2);
  });
});

describe('createOrder', () => {
  it('prints the created order ID on success', async () => {
    const repo = new InMemoryOrderRepository();
    const useCase = new CreateOrderUseCase(cliActorRepo(), repo, new SimpleEventBus());
    const output = new RecordingOutput();

    await createOrder(useCase, output, 'ward-1', 'med-1', 5);

    expect(output.messages).toHaveLength(1);
    expect(output.messages[0]).toContain('created');
  });

  it('exits with code 1 and prints an error on validation failure', async () => {
    const useCase = new CreateOrderUseCase(cliActorRepo(), new InMemoryOrderRepository(), new SimpleEventBus());
    const output = new RecordingOutput();

    await expect(createOrder(useCase, output, 'ward-1', 'med-1', 0)).rejects.toThrow(ExitError);
    expect(output.errors[0]).toContain('OrderLineQuantitiesPositive');
  });
});

describe('sendOrder', () => {
  it('prints the new status on success', async () => {
    const repo = new InMemoryOrderRepository();
    const eventBus = new SimpleEventBus();
    const actorRepo = cliActorRepo();
    const created = await new CreateOrderUseCase(actorRepo, repo, eventBus).execute({
      actorId: 'cli-nurse',
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }],
    });
    if (!created.successful) throw new Error('setup failed');
    const useCase = new SendOrderUseCase(actorRepo, repo, eventBus);
    const output = new RecordingOutput();

    await sendOrder(useCase, output, created.value.id);

    expect(output.messages[0]).toContain('Sent');
  });

  it('exits with code 1 for an unknown order', async () => {
    const useCase = new SendOrderUseCase(cliActorRepo(), new InMemoryOrderRepository(), new SimpleEventBus());
    const output = new RecordingOutput();

    await expect(sendOrder(useCase, output, 'no-such-order')).rejects.toThrow(ExitError);
    expect(output.errors[0]).toContain('OrderNotFound');
  });
});

describe('confirmOrder', () => {
  it('prints the new status on success', async () => {
    const repo = new InMemoryOrderRepository();
    const eventBus = new SimpleEventBus();
    const actorRepo = cliActorRepo();
    const created = await new CreateOrderUseCase(actorRepo, repo, eventBus).execute({
      actorId: 'cli-nurse',
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }],
    });
    if (!created.successful) throw new Error('setup failed');
    await new SendOrderUseCase(actorRepo, repo, eventBus).execute({ actorId: 'cli-nurse', orderId: created.value.id });
    const useCase = new ConfirmOrderUseCase(actorRepo, repo, eventBus);
    const output = new RecordingOutput();

    await confirmOrder(useCase, output, created.value.id);

    expect(output.messages[0]).toContain('Confirmed');
  });

  it('exits with code 1 for an unknown order', async () => {
    const useCase = new ConfirmOrderUseCase(cliActorRepo(), new InMemoryOrderRepository(), new SimpleEventBus());
    const output = new RecordingOutput();

    await expect(confirmOrder(useCase, output, 'no-such-order')).rejects.toThrow(ExitError);
    expect(output.errors[0]).toContain('OrderNotFound');
  });
});

describe('deliverOrder', () => {
  it('prints a confirmation on success', async () => {
    const orderRepo = new InMemoryOrderRepository();
    const medicinalProductRepo = new InMemoryMedicinalProductRepository();
    const eventBus = new SimpleEventBus();
    const actorRepo = cliActorRepo();
    await medicinalProductRepo.save(new MedicinalProduct('prod-1' as MedicinalProductId, 'Paracetamol 500mg', 'med-1' as MedicationId, new Decimal(10), new Decimal(5)));
    const created = await new CreateOrderUseCase(actorRepo, orderRepo, eventBus).execute({
      actorId: 'cli-nurse',
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }],
    });
    if (!created.successful) throw new Error('setup failed');
    await new SendOrderUseCase(actorRepo, orderRepo, eventBus).execute({ actorId: 'cli-nurse', orderId: created.value.id });
    await new ConfirmOrderUseCase(actorRepo, orderRepo, eventBus).execute({ actorId: 'cli-pharmacist', orderId: created.value.id });
    const useCase = new DeliverOrderUseCase(actorRepo, orderRepo, medicinalProductRepo, eventBus);
    const output = new RecordingOutput();

    await deliverOrder(useCase, output, created.value.id, [{ medicationId: 'med-1', medicinalProductId: 'prod-1', quantity: 5 }]);

    expect(output.messages[0]).toContain('delivered');
  });
});
