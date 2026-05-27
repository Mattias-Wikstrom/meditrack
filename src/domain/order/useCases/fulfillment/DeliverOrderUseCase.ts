import { Order } from '../../Order';
import { OrderStatus } from '../../OrderStatus';
import { OrderRepository } from '../../OrderRepository';
import { MedicinalProductRepository } from '../../../medication/MedicinalProductRepository';
import { ActorRepository } from '../../../actor/ActorRepository';
import { ActorRole } from '../../../shared/ActorRole';
import { Transactor } from '../../../shared/Transactor';
import { EventBus } from '../../../shared/eventContracts/EventBus';
import { UseCaseResult, success, failure, failures } from '../../../shared/results/UseCaseResult';
import { OrderDelivered } from '../../events/OrderDelivered';
import { StockBelowThreshold } from '../../../medication/events/StockBelowThreshold';
import { MedicationId, MedicinalProductId, OrderId } from '../../../shared/IdTypes';
import { DeliveryRule } from '../../rules/interfaces/DeliveryRule';
import { DeliveryPlan, ResolvedLine } from '../../rules/DeliveryPlan';
import { OrderMustBeConfirmed } from '../../rules/OrderMustBeConfirmed';
import { DeliveryCoversOrder } from '../../rules/DeliveryCoversOrder';
import { SufficientStock } from '../../rules/SufficientStock';
import { ErrorInfo } from '../../../shared/results/ErrorInfo';

// The pharmacist is picking stock off the shelf. They're telling the system: "to fulfil this order, I'm taking these specific products, in these quantities."

// A ProductSelection can specify, for example, that a request for Paracetamol
// is to be handled using Alvedon
export interface ProductSelection {
  medicationId: MedicationId; // For example, Paracetamol 500mg
  medicinalProductId: MedicinalProductId; // For example, Alvedon 500mg
  quantity: number;
}

// The input to the use case
export interface DeliverOrderInput {
  actorId: string; // The person who is interacting with the system
  orderId: OrderId; // The order
  productSelections: ReadonlyArray<ProductSelection>; // How the order is to be handled
}

export class DeliverOrderUseCase {
  // Business rules that are checked as part of the use case
  private readonly rules: DeliveryRule[] = [
    new OrderMustBeConfirmed(),
    new DeliveryCoversOrder(),
    new SufficientStock(),
  ];

  constructor(
    private readonly actorRepository: ActorRepository,
    private readonly orderRepository: OrderRepository,
    private readonly medicinalProductRepository: MedicinalProductRepository,
    private readonly transactor: Transactor,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: DeliverOrderInput): Promise<UseCaseResult<Order>> {
    const actor = await this.actorRepository.findById(input.actorId);
    if (actor === undefined) {
      return failure('ActorNotFound');
    }
    if (actor.role !== ActorRole.Pharmacist) {
      return failure('UnauthorizedRole');
    }

    // Find the order in the database from the orderId that was specified
    const order = await this.orderRepository.findById(input.orderId);

    if (order === undefined) {
      return failure('OrderNotFound');
    }

    // Find the selected products in the database
    const resolvedLines: ResolvedLine[] = [];

    for (const selection of input.productSelections) {
      // Look up the selected product in the database
      const product = await this.medicinalProductRepository.findById(selection.medicinalProductId);

      if (product === undefined) {
        return failure('MedicinalProductNotFound');
      }

      resolvedLines.push({
        medicationId: selection.medicationId, // What was requested?
        product, // The product that has been picked from the shelf
        quantity: selection.quantity, // How much was requested?
      });
    }

    // The order along with the information on how it is to be handled
    const plan: DeliveryPlan = { order, resolvedLines };

    // Verify that no business rule has been violated
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

    // All reads and validation passed. Run writes + audit atomically.
    const thresholdEvents: StockBelowThreshold[] = [];

    await this.transactor.run(async (tx) => {
      for (const line of plan.resolvedLines) {
        const wasBelowThreshold = line.product.isBelowThreshold;

        line.product.stockLevel = line.product.stockLevel - line.quantity;
        await tx.medicinalProductRepository.save(line.product);

        if (line.product.isBelowThreshold && !wasBelowThreshold) {
          thresholdEvents.push(new StockBelowThreshold(input.actorId, line.product));
        }
      }

      order.status = OrderStatus.Delivered;
      await tx.orderRepository.save(order);
      await tx.auditRepository.record({ actorId: input.actorId, action: 'OrderDelivered', entityId: order.id, occurredAt: new Date() });
    });

    // Publish real-time notification events after the transaction commits.
    for (const ev of thresholdEvents) {
      await this.eventBus.publish(ev);
    }
    await this.eventBus.publish(new OrderDelivered(input.actorId, order));

    return success(order);
  }
}
