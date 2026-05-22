import { Order } from '../../Order';
import { OrderStatus } from '../../OrderStatus';
import { OrderRepository } from '../../OrderRepository';
import { MedicationRepository } from '../../../medication/MedicationRepository';
import { EventBus } from '../../../shared/EventBus';
import { UseCaseResult, success, failure } from '../../../shared/UseCaseResult';
import { OrderDelivered } from '../../events/OrderDelivered';
import { StockBelowThreshold } from '../../../medication/events/StockBelowThreshold';

export interface DeliverOrderInput {
  actorId: string;
  orderId: string;
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
      return failure('OrderNotFound', `Order '${input.orderId}' not found.`);
    }

    if (order.status !== OrderStatus.Confirmed) {
      return failure(
        'InvalidStatusTransition',
        `Order must be in '${OrderStatus.Confirmed}' status to be delivered, but is '${order.status}'.`,
      );
    }

    for (const line of order.lines) {
      const medication = this.medicationRepository.findById(line.medicationId);
      if (medication === undefined) {
        return failure('MedicationNotFound', `Medication '${line.medicationId}' not found.`);
      }
      medication.stockLevel += line.quantity;
      this.medicationRepository.save(medication);

      if (medication.isBelowThreshold) {
        this.eventBus.publish(
          new StockBelowThreshold(
            input.actorId,
            medication.id,
            medication.name,
            medication.stockLevel,
            medication.stockThreshold,
          ),
        );
      }
    }

    order.status = OrderStatus.Delivered;
    this.orderRepository.save(order);
    this.eventBus.publish(new OrderDelivered(input.actorId, order.id));
    return success(order);
  }
}
