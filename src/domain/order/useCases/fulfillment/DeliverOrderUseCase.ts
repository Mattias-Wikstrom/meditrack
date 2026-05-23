import { Order } from '../../Order';
import { OrderStatus } from '../../OrderStatus';
import { OrderRepository } from '../../OrderRepository';
import { MedicationRepository } from '../../../medication/MedicationRepository';
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
    private readonly medicationRepository: MedicationRepository,
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
      const medication = this.medicationRepository.findById(line.medicationId);
      if (medication === undefined) {
        return failure('MedicationNotFound');
      }
      medication.stockLevel = medication.stockLevel.add(line.quantity);
      this.medicationRepository.save(medication);

      if (medication.isBelowThreshold) {
        this.eventBus.publish(new StockBelowThreshold(input.actorId, medication));
      }
    }

    order.status = OrderStatus.Delivered;
    this.orderRepository.save(order);
    this.eventBus.publish(new OrderDelivered(input.actorId, order));
    return success(order);
  }
}
