import { GraphQLContext } from '../../src/api/graphql/context';
import { InMemoryMedicationRepository } from '../../src/storage/inMemory/InMemoryMedicationRepository';
import { InMemoryMedicinalProductRepository } from '../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { InMemoryOrderRepository } from '../../src/storage/inMemory/InMemoryOrderRepository';
import { InMemoryWardUnitRepository } from '../../src/storage/inMemory/InMemoryWardUnitRepository';
import { SimpleEventBus } from '../../src/events/simple/SimpleEventBus';
import { CreateOrderUseCase } from '../../src/domain/order/useCases/ordering/CreateOrderUseCase';
import { AdvanceOrderStatusUseCase } from '../../src/domain/order/useCases/fulfillment/AdvanceOrderStatusUseCase';
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
    advanceOrderStatusUseCase: new AdvanceOrderStatusUseCase(orderRepo, eventBus),
    deliverOrderUseCase: new DeliverOrderUseCase(orderRepo, medicinalProductRepo, eventBus),
    actorId,
  };
}
