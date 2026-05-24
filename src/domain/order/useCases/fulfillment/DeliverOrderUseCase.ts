import { Order } from '../../Order';
import { OrderStatus } from '../../OrderStatus';
import { OrderRepository } from '../../OrderRepository';
import { MedicinalProductRepository } from '../../../medication/MedicinalProductRepository';
import { EventBus } from '../../../shared/EventBus';
import { UseCaseResult, success, failure } from '../../../shared/UseCaseResult';
import { OrderDelivered } from '../../events/OrderDelivered';
import { StockBelowThreshold } from '../../../medication/events/StockBelowThreshold';
import { OrderId } from '../../../shared/Id';

export interface DeliverOrderInput {
  actorId: string;
  orderId: OrderId;
}

export class DeliverOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly medicinalProductRepository: MedicinalProductRepository,
    private readonly eventBus: EventBus,
  ) {}

  execute(input: DeliverOrderInput): UseCaseResult<Order> {
    const order = this.orderRepository.findById(input.orderId);
    if (order === undefined) {
      return failure('OrderNotFound');
    }

    if (order.status !== OrderStatus.Confirmed) {
      return failure('InvalidStatusTransition');
    }

    for (const line of order.lines) {
      const [product] = this.medicinalProductRepository.findByMedicationId(line.medicationId);
      if (product === undefined) {
        return failure('MedicinalProductNotFound');
      }
      product.stockLevel = product.stockLevel.add(line.quantity);
      this.medicinalProductRepository.save(product);

      if (product.isBelowThreshold) {
        this.eventBus.publish(new StockBelowThreshold(input.actorId, product));
      }
    }

    order.status = OrderStatus.Delivered;
    this.orderRepository.save(order);
    this.eventBus.publish(new OrderDelivered(input.actorId, order));
    return success(order);
  }
}
