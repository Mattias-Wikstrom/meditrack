import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../domain/shared/eventContracts/EventBus';
import { PrismaMedicationRepository } from '../../storage/prisma/PrismaMedicationRepository';
import { PrismaMedicinalProductRepository } from '../../storage/prisma/PrismaMedicinalProductRepository';
import { PrismaOrderRepository } from '../../storage/prisma/PrismaOrderRepository';
import { PrismaWardUnitRepository } from '../../storage/prisma/PrismaWardUnitRepository';
import { PrismaActorRepository } from '../../storage/prisma/PrismaActorRepository';
import { PrismaTransactor } from '../../storage/prisma/PrismaTransactor';
import { CreateOrderUseCase } from '../../domain/order/useCases/ordering/CreateOrderUseCase';
import { SendOrderUseCase } from '../../domain/order/useCases/fulfillment/SendOrderUseCase';
import { ConfirmOrderUseCase } from '../../domain/order/useCases/fulfillment/ConfirmOrderUseCase';
import { DeliverOrderUseCase } from '../../domain/order/useCases/fulfillment/DeliverOrderUseCase';

export function createWiring(prisma: PrismaClient, eventBus: EventBus) {
  const medicationRepo = new PrismaMedicationRepository(prisma);
  const medicinalProductRepo = new PrismaMedicinalProductRepository(prisma);
  const orderRepo = new PrismaOrderRepository(prisma);
  const wardUnitRepo = new PrismaWardUnitRepository(prisma);
  const actorRepo = new PrismaActorRepository(prisma);
  const transactor = new PrismaTransactor(prisma);

  return {
    medicationRepo,
    medicinalProductRepo,
    orderRepo,
    wardUnitRepo,
    createOrderUseCase: new CreateOrderUseCase(actorRepo, transactor, eventBus),
    sendOrderUseCase: new SendOrderUseCase(actorRepo, orderRepo, transactor, eventBus),
    confirmOrderUseCase: new ConfirmOrderUseCase(actorRepo, orderRepo, transactor, eventBus),
    deliverOrderUseCase: new DeliverOrderUseCase(actorRepo, orderRepo, medicinalProductRepo, transactor, eventBus),
  };
}

export type ServerWiring = ReturnType<typeof createWiring>;
