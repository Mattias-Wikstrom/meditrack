import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../domain/shared/eventContracts/EventBus';
import { PrismaMedicationRepository } from '../../storage/prisma/PrismaMedicationRepository';
import { PrismaMedicinalProductRepository } from '../../storage/prisma/PrismaMedicinalProductRepository';
import { PrismaOrderRepository } from '../../storage/prisma/PrismaOrderRepository';
import { PrismaWardUnitRepository } from '../../storage/prisma/PrismaWardUnitRepository';
import { PrismaActorRepository } from '../../storage/prisma/PrismaActorRepository';
import { PrismaAuditRepository } from '../../storage/prisma/PrismaAuditRepository';
import { PrismaTransactor } from '../../storage/prisma/PrismaTransactor';
import { CreateActorUseCase } from '../../domain/actor/useCases/CreateActorUseCase';
import { UpdateActorUseCase } from '../../domain/actor/useCases/UpdateActorUseCase';
import { DeleteActorUseCase } from '../../domain/actor/useCases/DeleteActorUseCase';
import { CreateWardUnitUseCase } from '../../domain/wardUnit/useCases/CreateWardUnitUseCase';
import { UpdateWardUnitUseCase } from '../../domain/wardUnit/useCases/UpdateWardUnitUseCase';
import { DeleteWardUnitUseCase } from '../../domain/wardUnit/useCases/DeleteWardUnitUseCase';
import { CreateOrderUseCase } from '../../domain/order/useCases/ordering/CreateOrderUseCase';
import { UpdateOrderLinesUseCase } from '../../domain/order/useCases/ordering/UpdateOrderLinesUseCase';
import { SendOrderUseCase } from '../../domain/order/useCases/fulfillment/SendOrderUseCase';
import { ConfirmOrderUseCase } from '../../domain/order/useCases/fulfillment/ConfirmOrderUseCase';
import { DeliverOrderUseCase } from '../../domain/order/useCases/fulfillment/DeliverOrderUseCase';
import { RestockUseCase } from '../../domain/medication/useCases/RestockUseCase';
import { CreateMedicationUseCase } from '../../domain/medication/useCases/CreateMedicationUseCase';
import { UpdateMedicationUseCase } from '../../domain/medication/useCases/UpdateMedicationUseCase';
import { DeleteMedicationUseCase } from '../../domain/medication/useCases/DeleteMedicationUseCase';
import { CreateMedicinalProductUseCase } from '../../domain/medication/useCases/CreateMedicinalProductUseCase';
import { UpdateMedicinalProductUseCase } from '../../domain/medication/useCases/UpdateMedicinalProductUseCase';
import { DeleteMedicinalProductUseCase } from '../../domain/medication/useCases/DeleteMedicinalProductUseCase';
import { PrismaCredentialsRepository } from '../../storage/prisma/PrismaCredentialsRepository';

export function createWiring(prisma: PrismaClient, eventBus: EventBus) {
  const medicationRepo = new PrismaMedicationRepository(prisma);
  const medicinalProductRepo = new PrismaMedicinalProductRepository(prisma);
  const orderRepo = new PrismaOrderRepository(prisma);
  const wardUnitRepo = new PrismaWardUnitRepository(prisma);
  const actorRepo = new PrismaActorRepository(prisma);
  const auditRepo = new PrismaAuditRepository(prisma);
  const transactor = new PrismaTransactor(prisma);
  const credentialsRepo = new PrismaCredentialsRepository(prisma);

  return {
    medicationRepo,
    medicinalProductRepo,
    orderRepo,
    wardUnitRepo,
    actorRepo,
    auditRepo,
    createActorUseCase: new CreateActorUseCase(actorRepo, credentialsRepo, transactor, eventBus),
    updateActorUseCase: new UpdateActorUseCase(actorRepo, transactor, eventBus),
    deleteActorUseCase: new DeleteActorUseCase(actorRepo, transactor, eventBus),
    createWardUnitUseCase: new CreateWardUnitUseCase(wardUnitRepo, actorRepo, transactor, eventBus),
    updateWardUnitUseCase: new UpdateWardUnitUseCase(wardUnitRepo, actorRepo, transactor, eventBus),
    deleteWardUnitUseCase: new DeleteWardUnitUseCase(wardUnitRepo, actorRepo, transactor, eventBus),
    createOrderUseCase: new CreateOrderUseCase(actorRepo, transactor, eventBus),
    updateOrderLinesUseCase: new UpdateOrderLinesUseCase(actorRepo, orderRepo, transactor, eventBus),
    sendOrderUseCase: new SendOrderUseCase(actorRepo, orderRepo, transactor, eventBus),
    confirmOrderUseCase: new ConfirmOrderUseCase(actorRepo, orderRepo, transactor, eventBus),
    deliverOrderUseCase: new DeliverOrderUseCase(actorRepo, orderRepo, medicinalProductRepo, transactor, eventBus),
    restockUseCase: new RestockUseCase(actorRepo, medicinalProductRepo, transactor),
    createMedicationUseCase: new CreateMedicationUseCase(medicationRepo, actorRepo, transactor),
    updateMedicationUseCase: new UpdateMedicationUseCase(medicationRepo, actorRepo, transactor),
    deleteMedicationUseCase: new DeleteMedicationUseCase(medicationRepo, medicinalProductRepo, actorRepo, transactor),
    createMedicinalProductUseCase: new CreateMedicinalProductUseCase(medicinalProductRepo, medicationRepo, actorRepo, transactor),
    updateMedicinalProductUseCase: new UpdateMedicinalProductUseCase(medicinalProductRepo, actorRepo, transactor),
    deleteMedicinalProductUseCase: new DeleteMedicinalProductUseCase(medicinalProductRepo, actorRepo, transactor),
    credentialsRepo,
  };
}

export type ServerWiring = ReturnType<typeof createWiring>;
