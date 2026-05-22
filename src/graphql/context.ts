import { MedicationRepository } from '../domain/medication/MedicationRepository';
import { OrderRepository } from '../domain/order/OrderRepository';
import { WardUnitRepository } from '../domain/wardUnit/WardUnitRepository';
import { CreateOrderUseCase } from '../domain/order/useCases/ordering/CreateOrderUseCase';
import { AdvanceOrderStatusUseCase } from '../domain/order/useCases/fulfillment/AdvanceOrderStatusUseCase';
import { DeliverOrderUseCase } from '../domain/order/useCases/fulfillment/DeliverOrderUseCase';

export interface GraphQLContext {
  medicationRepo: MedicationRepository;
  orderRepo: OrderRepository;
  wardUnitRepo: WardUnitRepository;
  createOrderUseCase: CreateOrderUseCase;
  advanceOrderStatusUseCase: AdvanceOrderStatusUseCase;
  deliverOrderUseCase: DeliverOrderUseCase;
  actorId: string;
}
