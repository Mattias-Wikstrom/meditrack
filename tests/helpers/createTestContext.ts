import { GraphQLContext } from '../../src/api/graphql/context';
import { InMemoryMedicationRepository } from '../../src/storage/inMemory/InMemoryMedicationRepository';
import { InMemoryMedicinalProductRepository } from '../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { InMemoryOrderRepository } from '../../src/storage/inMemory/InMemoryOrderRepository';
import { InMemoryWardUnitRepository } from '../../src/storage/inMemory/InMemoryWardUnitRepository';
import { SimpleEventBus } from '../../src/eventBus/SimpleEventBus';
import { CreateOrderUseCase } from '../../src/domain/order/useCases/ordering/CreateOrderUseCase';
import { SendOrderUseCase } from '../../src/domain/order/useCases/fulfillment/SendOrderUseCase';
import { ConfirmOrderUseCase } from '../../src/domain/order/useCases/fulfillment/ConfirmOrderUseCase';
import { DeliverOrderUseCase } from '../../src/domain/order/useCases/fulfillment/DeliverOrderUseCase';

export function createTestContext(actorId = 'test-actor'): GraphQLContext & {
  medicationRepo: InMemoryMedicationRepository;
  medicinalProductRepo: InMemoryMedicinalProductRepository;
  orderRepo: InMemoryOrderRepository;
  wardUnitRepo: InMemoryWardUnitRepository;
} {
  const medicationRepo = new InMemoryMedicationRepository();
  const medicinalProductRepo = new InMemoryMedicinalProductRepository();
  const orderRepo = new InMemoryOrderRepository();
  const wardUnitRepo = new InMemoryWardUnitRepository();
  const eventBus = new SimpleEventBus();

  return {
    medicationRepo,
    medicinalProductRepo,
    orderRepo,
    wardUnitRepo,
    createOrderUseCase: new CreateOrderUseCase(orderRepo, eventBus),
    sendOrderUseCase: new SendOrderUseCase(orderRepo, eventBus),
    confirmOrderUseCase: new ConfirmOrderUseCase(orderRepo, eventBus),
    deliverOrderUseCase: new DeliverOrderUseCase(orderRepo, medicinalProductRepo, eventBus),
    actorId,
  };
}
