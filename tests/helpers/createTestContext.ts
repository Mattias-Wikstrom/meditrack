import { GraphQLContext } from '../../src/graphql/context';
import { InMemoryMedicationRepository } from '../../src/infrastructure/inMemory/InMemoryMedicationRepository';
import { InMemoryOrderRepository } from '../../src/infrastructure/inMemory/InMemoryOrderRepository';
import { InMemoryWardUnitRepository } from '../../src/infrastructure/inMemory/InMemoryWardUnitRepository';
import { SimpleEventBus } from '../../src/infrastructure/events/SimpleEventBus';
import { CreateOrderUseCase } from '../../src/domain/order/useCases/ordering/CreateOrderUseCase';
import { AdvanceOrderStatusUseCase } from '../../src/domain/order/useCases/fulfillment/AdvanceOrderStatusUseCase';
import { DeliverOrderUseCase } from '../../src/domain/order/useCases/fulfillment/DeliverOrderUseCase';

export function createTestContext(actorId = 'test-actor'): GraphQLContext & {
  medicationRepo: InMemoryMedicationRepository;
  orderRepo: InMemoryOrderRepository;
  wardUnitRepo: InMemoryWardUnitRepository;
} {
  const medicationRepo = new InMemoryMedicationRepository();
  const orderRepo = new InMemoryOrderRepository();
  const wardUnitRepo = new InMemoryWardUnitRepository();
  const eventBus = new SimpleEventBus();

  return {
    medicationRepo,
    orderRepo,
    wardUnitRepo,
    createOrderUseCase: new CreateOrderUseCase(orderRepo, eventBus),
    advanceOrderStatusUseCase: new AdvanceOrderStatusUseCase(orderRepo, eventBus),
    deliverOrderUseCase: new DeliverOrderUseCase(orderRepo, medicationRepo, eventBus),
    actorId,
  };
}
