import { GraphQLContext } from '../../src/api/graphql/context';
import { InMemoryActorRepository } from '../../src/storage/inMemory/InMemoryActorRepository';
import { InMemoryCredentialsRepository } from '../../src/storage/inMemory/InMemoryCredentialsRepository';
import { InMemoryMedicationRepository } from '../../src/storage/inMemory/InMemoryMedicationRepository';
import { InMemoryMedicinalProductRepository } from '../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { InMemoryOrderRepository } from '../../src/storage/inMemory/InMemoryOrderRepository';
import { InMemoryWardUnitRepository } from '../../src/storage/inMemory/InMemoryWardUnitRepository';
import { InMemoryAuditRepository } from '../../src/storage/inMemory/InMemoryAuditRepository';
import { InMemoryTransactor } from '../../src/storage/inMemory/InMemoryTransactor';
import { ActorRole } from '../../src/domain/shared/ActorRole';
import { SimpleEventBus } from '../../src/eventBus/SimpleEventBus';
import { CreateOrderUseCase } from '../../src/domain/order/useCases/ordering/CreateOrderUseCase';
import { UpdateOrderLinesUseCase } from '../../src/domain/order/useCases/ordering/UpdateOrderLinesUseCase';
import { SendOrderUseCase } from '../../src/domain/order/useCases/fulfillment/SendOrderUseCase';
import { ConfirmOrderUseCase } from '../../src/domain/order/useCases/fulfillment/ConfirmOrderUseCase';
import { DeliverOrderUseCase } from '../../src/domain/order/useCases/fulfillment/DeliverOrderUseCase';
import { RestockUseCase } from '../../src/domain/medication/useCases/RestockUseCase';

export function createTestContext(actorId = 'test-actor'): GraphQLContext & {
  medicationRepo: InMemoryMedicationRepository;
  medicinalProductRepo: InMemoryMedicinalProductRepository;
  orderRepo: InMemoryOrderRepository;
  wardUnitRepo: InMemoryWardUnitRepository;
} {
  const actorRepo = new InMemoryActorRepository([
    { id: 'nurse-1', role: ActorRole.Nurse },
    { id: 'pharmacist-1', role: ActorRole.Pharmacist },
    { id: actorId, role: ActorRole.Nurse },
  ]);
  const credentialsRepo = new InMemoryCredentialsRepository();
  const medicationRepo = new InMemoryMedicationRepository();
  const medicinalProductRepo = new InMemoryMedicinalProductRepository();
  const orderRepo = new InMemoryOrderRepository();
  const wardUnitRepo = new InMemoryWardUnitRepository();
  const auditRepo = new InMemoryAuditRepository();
  const transactor = new InMemoryTransactor(orderRepo, medicinalProductRepo, auditRepo);
  const eventBus = new SimpleEventBus();

  return {
    medicationRepo,
    medicinalProductRepo,
    orderRepo,
    wardUnitRepo,
    actorRepo,
    auditRepo,
    credentialsRepo,
    createOrderUseCase: new CreateOrderUseCase(actorRepo, transactor, eventBus),
    updateOrderLinesUseCase: new UpdateOrderLinesUseCase(actorRepo, orderRepo, transactor, eventBus),
    sendOrderUseCase: new SendOrderUseCase(actorRepo, orderRepo, transactor, eventBus),
    confirmOrderUseCase: new ConfirmOrderUseCase(actorRepo, orderRepo, transactor, eventBus),
    deliverOrderUseCase: new DeliverOrderUseCase(actorRepo, orderRepo, medicinalProductRepo, transactor, eventBus),
    restockUseCase: new RestockUseCase(actorRepo, medicinalProductRepo, transactor),
    actorId,
  };
}
