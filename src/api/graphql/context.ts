import { MedicationRepository } from '../../domain/medication/MedicationRepository';
import { MedicinalProductRepository } from '../../domain/medication/MedicinalProductRepository';
import { OrderRepository } from '../../domain/order/OrderRepository';
import { WardUnitRepository } from '../../domain/wardUnit/WardUnitRepository';
import { CreateOrderUseCase } from '../../domain/order/useCases/ordering/CreateOrderUseCase';
import { UpdateOrderLinesUseCase } from '../../domain/order/useCases/ordering/UpdateOrderLinesUseCase';
import { SendOrderUseCase } from '../../domain/order/useCases/fulfillment/SendOrderUseCase';
import { ConfirmOrderUseCase } from '../../domain/order/useCases/fulfillment/ConfirmOrderUseCase';
import { DeliverOrderUseCase } from '../../domain/order/useCases/fulfillment/DeliverOrderUseCase';
import { RestockUseCase } from '../../domain/medication/useCases/RestockUseCase';

export interface GraphQLContext {
  medicationRepo: MedicationRepository;
  medicinalProductRepo: MedicinalProductRepository;
  orderRepo: OrderRepository;
  wardUnitRepo: WardUnitRepository;
  createOrderUseCase: CreateOrderUseCase;
  updateOrderLinesUseCase: UpdateOrderLinesUseCase;
  sendOrderUseCase: SendOrderUseCase;
  confirmOrderUseCase: ConfirmOrderUseCase;
  deliverOrderUseCase: DeliverOrderUseCase;
  restockUseCase: RestockUseCase;
  actorId: string;
}
