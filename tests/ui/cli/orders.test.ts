import { describe, it, expect, beforeEach } from 'vitest';
import { listOrders, createOrder, sendOrder, confirmOrder, deliverOrder } from '../../../src/ui/cli/commands/orders';
import { InMemoryActorRepository } from '../../../src/storage/inMemory/InMemoryActorRepository';
import { InMemoryOrderRepository } from '../../../src/storage/inMemory/InMemoryOrderRepository';
import { InMemoryMedicinalProductRepository } from '../../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { InMemoryAuditRepository } from '../../../src/storage/inMemory/InMemoryAuditRepository';
import { InMemoryTransactor } from '../../../src/storage/inMemory/InMemoryTransactor';
import { SimpleEventBus } from '../../../src/eventBus/SimpleEventBus';
import { CreateOrderUseCase } from '../../../src/domain/order/useCases/ordering/CreateOrderUseCase';
import { SendOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/SendOrderUseCase';
import { ConfirmOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/ConfirmOrderUseCase';
import { DeliverOrderUseCase } from '../../../src/domain/order/useCases/fulfillment/DeliverOrderUseCase';
import { MedicinalProduct } from '../../../src/domain/medication/MedicinalProduct';
import { ActorRole } from '../../../src/domain/shared/ActorRole';
import { MedicationId, MedicinalProductId, WardUnitId } from '../../../src/domain/shared/IdTypes';
import { RecordingOutput, ExitError } from './RecordingOutput';

const makeActorRepo = () =>
  new InMemoryActorRepository([
    { id: 'nurse-1', role: ActorRole.Nurse },
    { id: 'pharmacist-1', role: ActorRole.Pharmacist },
  ]);

const makeTransactor = (orderRepo: InMemoryOrderRepository, productRepo = new InMemoryMedicinalProductRepository()) =>
  new InMemoryTransactor(orderRepo, productRepo, new InMemoryAuditRepository());

describe('listOrders', () => {
  it('prints a message when there are no orders', async () => {
    const output = new RecordingOutput();

    await listOrders(new InMemoryOrderRepository(), output);

    expect(output.messages).toEqual(['No orders.']);
  });

  it('prints one line per order', async () => {
    const repo = new InMemoryOrderRepository();
    const actorRepo = makeActorRepo();
    const transactor = makeTransactor(repo);
    const useCase = new CreateOrderUseCase(actorRepo, transactor, new SimpleEventBus());
    await useCase.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1' as WardUnitId, lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }] });
    await useCase.execute({ actorId: 'nurse-1', wardUnitId: 'ward-1' as WardUnitId, lines: [{ medicationId: 'med-2' as MedicationId, quantity: 3 }] });
    const output = new RecordingOutput();

    await listOrders(repo, output);

    expect(output.messages).toHaveLength(2);
  });
});

describe('createOrder', () => {
  it('prints the created order ID on success', async () => {
    const orderRepo = new InMemoryOrderRepository();
    const useCase = new CreateOrderUseCase(makeActorRepo(), makeTransactor(orderRepo), new SimpleEventBus());
    const output = new RecordingOutput();

    await createOrder(useCase, output, 'nurse-1', 'ward-1', 'med-1', 5);

    expect(output.messages).toHaveLength(1);
    expect(output.messages[0]).toContain('created');
  });

  it('exits with code 1 and prints an error on validation failure', async () => {
    const orderRepo = new InMemoryOrderRepository();
    const useCase = new CreateOrderUseCase(makeActorRepo(), makeTransactor(orderRepo), new SimpleEventBus());
    const output = new RecordingOutput();

    await expect(createOrder(useCase, output, 'nurse-1', 'ward-1', 'med-1', 0)).rejects.toThrow(ExitError);
    expect(output.errors[0]).toContain('greater than zero');
  });
});

describe('sendOrder', () => {
  it('prints the new status on success', async () => {
    const repo = new InMemoryOrderRepository();
    const eventBus = new SimpleEventBus();
    const actorRepo = makeActorRepo();
    const transactor = makeTransactor(repo);
    const created = await new CreateOrderUseCase(actorRepo, transactor, eventBus).execute({
      actorId: 'nurse-1',
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }],
    });
    if (!created.successful) throw new Error('setup failed');
    const useCase = new SendOrderUseCase(actorRepo, repo, transactor, eventBus);
    const output = new RecordingOutput();

    await sendOrder(useCase, output, 'nurse-1', created.value.id);

    expect(output.messages[0]).toContain('Sent');
  });

  it('exits with code 1 for an unknown order', async () => {
    const orderRepo = new InMemoryOrderRepository();
    const useCase = new SendOrderUseCase(makeActorRepo(), orderRepo, makeTransactor(orderRepo), new SimpleEventBus());
    const output = new RecordingOutput();

    await expect(sendOrder(useCase, output, 'nurse-1', 'no-such-order')).rejects.toThrow(ExitError);
    expect(output.errors[0]).toContain('Order not found');
  });
});

describe('confirmOrder', () => {
  it('prints the new status on success', async () => {
    const repo = new InMemoryOrderRepository();
    const eventBus = new SimpleEventBus();
    const actorRepo = makeActorRepo();
    const transactor = makeTransactor(repo);
    const created = await new CreateOrderUseCase(actorRepo, transactor, eventBus).execute({
      actorId: 'nurse-1',
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }],
    });
    if (!created.successful) throw new Error('setup failed');
    await new SendOrderUseCase(actorRepo, repo, transactor, eventBus).execute({ actorId: 'nurse-1', orderId: created.value.id });
    const useCase = new ConfirmOrderUseCase(actorRepo, repo, transactor, eventBus);
    const output = new RecordingOutput();

    await confirmOrder(useCase, output, 'pharmacist-1', created.value.id);

    expect(output.messages[0]).toContain('Confirmed');
  });

  it('exits with code 1 for an unknown order', async () => {
    const orderRepo = new InMemoryOrderRepository();
    const useCase = new ConfirmOrderUseCase(makeActorRepo(), orderRepo, makeTransactor(orderRepo), new SimpleEventBus());
    const output = new RecordingOutput();

    await expect(confirmOrder(useCase, output, 'pharmacist-1', 'no-such-order')).rejects.toThrow(ExitError);
    expect(output.errors[0]).toContain('Order not found');
  });
});

describe('deliverOrder', () => {
  it('prints a confirmation on success', async () => {
    const orderRepo = new InMemoryOrderRepository();
    const medicinalProductRepo = new InMemoryMedicinalProductRepository();
    const eventBus = new SimpleEventBus();
    const actorRepo = makeActorRepo();
    const transactor = makeTransactor(orderRepo, medicinalProductRepo);
    await medicinalProductRepo.save(new MedicinalProduct('prod-1' as MedicinalProductId, 'Paracetamol 500mg', 'med-1' as MedicationId, 10, 5));
    const created = await new CreateOrderUseCase(actorRepo, transactor, eventBus).execute({
      actorId: 'nurse-1',
      wardUnitId: 'ward-1' as WardUnitId,
      lines: [{ medicationId: 'med-1' as MedicationId, quantity: 5 }],
    });
    if (!created.successful) throw new Error('setup failed');
    await new SendOrderUseCase(actorRepo, orderRepo, transactor, eventBus).execute({ actorId: 'nurse-1', orderId: created.value.id });
    await new ConfirmOrderUseCase(actorRepo, orderRepo, transactor, eventBus).execute({ actorId: 'pharmacist-1', orderId: created.value.id });
    const useCase = new DeliverOrderUseCase(actorRepo, orderRepo, medicinalProductRepo, transactor, eventBus);
    const output = new RecordingOutput();

    await deliverOrder(useCase, output, 'pharmacist-1', created.value.id, [{ medicationId: 'med-1', medicinalProductId: 'prod-1', quantity: 5 }]);

    expect(output.messages[0]).toContain('delivered');
  });
});
