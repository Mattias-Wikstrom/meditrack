import { Order } from '../../Order';
import { OrderStatus } from '../../OrderStatus';
import { OrderRepository } from '../../OrderRepository';
import { MedicinalProductRepository } from '../../../medication/MedicinalProductRepository';
import { EventBus } from '../../../shared/eventContracts/EventBus';
import { UseCaseResult, success, failure } from '../../../shared/results/UseCaseResult';
import { OrderDelivered } from '../../events/OrderDelivered';
import { StockBelowThreshold } from '../../../medication/events/StockBelowThreshold';
import { MedicationId, MedicinalProductId, OrderId } from '../../../shared/IdTypes';

export interface ProductSelection {
  medicationId: MedicationId;
  medicinalProductId: MedicinalProductId;
}

export interface DeliverOrderInput {
  actorId: string;
  orderId: OrderId;
  productSelections: ReadonlyArray<ProductSelection>;
}

export class DeliverOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly medicinalProductRepository: MedicinalProductRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: DeliverOrderInput): Promise<UseCaseResult<Order>> {
    const order = await this.orderRepository.findById(input.orderId);
    if (order === undefined) {
      return failure('OrderNotFound');
    }

    if (order.status !== OrderStatus.Confirmed) {
      return failure('InvalidStatusTransition');
    }

    for (const line of order.lines) {
      const selection = input.productSelections.find((s) => s.medicationId === line.medicationId);
      if (selection === undefined) {
        return failure('MissingProductSelection');
      }

      const product = await this.medicinalProductRepository.findById(selection.medicinalProductId);
      if (product === undefined) {
        return failure('MedicinalProductNotFound');
      }
      if (product.medicationId !== line.medicationId) {
        return failure('ProductMedicationMismatch');
      }

      product.stockLevel = product.stockLevel.add(line.quantity);
      await this.medicinalProductRepository.save(product);

      if (product.isBelowThreshold) {
        await this.eventBus.publish(new StockBelowThreshold(input.actorId, product));
      }
    }

    order.status = OrderStatus.Delivered;
    await this.orderRepository.save(order);
    await this.eventBus.publish(new OrderDelivered(input.actorId, order));
    return success(order);
  }
}
