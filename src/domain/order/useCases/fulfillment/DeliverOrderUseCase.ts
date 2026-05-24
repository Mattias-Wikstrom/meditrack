import Decimal from 'decimal.js';
import { Order } from '../../Order';
import { OrderStatus } from '../../OrderStatus';
import { OrderRepository } from '../../OrderRepository';
import { MedicinalProductRepository } from '../../../medication/MedicinalProductRepository';
import { EventBus } from '../../../shared/eventContracts/EventBus';
import { UseCaseResult, success, failure, failures } from '../../../shared/results/UseCaseResult';
import { OrderDelivered } from '../../events/OrderDelivered';
import { StockBelowThreshold } from '../../../medication/events/StockBelowThreshold';
import { MedicationId, MedicinalProductId, OrderId } from '../../../shared/IdTypes';
import { DeliveryRule } from '../../rules/DeliveryRule';
import { DeliveryPlan, ResolvedLine } from '../../rules/DeliveryPlan';
import { OrderMustBeConfirmed } from '../../rules/OrderMustBeConfirmed';
import { DeliveryCoversOrder } from '../../rules/DeliveryCoversOrder';
import { SufficientStock } from '../../rules/SufficientStock';
import { ErrorInfo } from '../../../shared/results/ErrorInfo';

export interface ProductSelection {
  medicationId: MedicationId;
  medicinalProductId: MedicinalProductId;
  quantity: number;
}

export interface DeliverOrderInput {
  actorId: string;
  orderId: OrderId;
  productSelections: ReadonlyArray<ProductSelection>;
}

export class DeliverOrderUseCase {
  private readonly rules: DeliveryRule[] = [
    new OrderMustBeConfirmed(),
    new DeliveryCoversOrder(),
    new SufficientStock(),
  ];

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

    const resolvedLines: ResolvedLine[] = [];
    for (const selection of input.productSelections) {
      const product = await this.medicinalProductRepository.findById(selection.medicinalProductId);
      if (product === undefined) {
        return failure('MedicinalProductNotFound');
      }
      resolvedLines.push({
        medicationId: selection.medicationId,
        product,
        quantity: new Decimal(selection.quantity),
      });
    }

    const plan: DeliveryPlan = { order, resolvedLines };

    const errors: ErrorInfo[] = [];
    for (const rule of this.rules) {
      const error = rule.check(plan);
      if (error !== null) {
        errors.push(error);
      }
    }
    if (errors.length > 0) {
      return failures(errors);
    }

    for (const line of plan.resolvedLines) {
      line.product.stockLevel = line.product.stockLevel.sub(line.quantity);
      await this.medicinalProductRepository.save(line.product);
      if (line.product.isBelowThreshold) {
        await this.eventBus.publish(new StockBelowThreshold(input.actorId, line.product));
      }
    }

    order.status = OrderStatus.Delivered;
    await this.orderRepository.save(order);
    await this.eventBus.publish(new OrderDelivered(input.actorId, order));
    return success(order);
  }
}
