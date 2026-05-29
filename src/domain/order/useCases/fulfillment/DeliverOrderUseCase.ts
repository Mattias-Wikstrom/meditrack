import { Order } from '../../Order';
import { OrderStatus } from '../../OrderStatus';
import { OrderRepository } from '../../OrderRepository';
import { MedicinalProductRepository } from '../../../medication/MedicinalProductRepository';
import { ActorRepository } from '../../../actor/ActorRepository';
import { ActorRole } from '../../../shared/ActorRole';
import { Transactor } from '../../../shared/Transactor';
import { EventBus } from '../../../shared/eventContracts/EventBus';
import { UseCaseResult, success, failure, failures } from '../../../shared/results/UseCaseResult';
import { OrderStatusAdvanced } from '../../events/OrderStatusAdvanced';
import { StockBelowThreshold } from '../../../medication/events/StockBelowThreshold';
import { MedicationId, MedicinalProductId, OrderId } from '../../../shared/IdTypes';
import { DeliveryRule } from '../../rules/interfaces/DeliveryRule';
import { DeliveryPlan, ResolvedLine } from '../../rules/DeliveryPlan';
import { OrderMustBeConfirmed } from '../../rules/OrderMustBeConfirmed';
import { DeliveryCoversOrder } from '../../rules/DeliveryCoversOrder';
import { SufficientStock } from '../../rules/SufficientStock';
import { ErrorInfo } from '../../../shared/results/ErrorInfo';
import { ConflictError } from '../../../shared/ConflictError';

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

    // Pre-compute the stock changes so we can check thresholds after the transaction.
    // previousLevel is captured here so it remains stable even if the in-memory object
    // is mutated by a concurrent operation before our transaction commits.
    const lineUpdates = plan.resolvedLines.map((line) => ({
      line,
      previousLevel: line.product.stockLevel,
      newLevel: line.product.stockLevel - line.quantity,
      wasBelowThreshold: line.product.isBelowThreshold,
    }));

    try {
      await this.transactor.run(async (tx) => {
        for (const { line, previousLevel, newLevel } of lineUpdates) {
          await tx.medicinalProductRepository.adjustStock(line.product.id, newLevel, previousLevel);
        }
        await tx.orderRepository.advanceStatus(order.id, OrderStatus.Delivered, order.status);
        await tx.auditRepository.record({ actorId: input.actorId, action: 'OrderDelivered', entityId: order.id, occurredAt: new Date() });
      });
    } catch (e) {
      if (e instanceof ConflictError) return failure('Conflict');
      throw e;
    }

    // Update in-memory objects and collect threshold events after the transaction commits.
    const thresholdEvents: StockBelowThreshold[] = [];
    for (const { line, newLevel, wasBelowThreshold } of lineUpdates) {
      line.product.stockLevel = newLevel;
      if (line.product.isBelowThreshold && !wasBelowThreshold) {
        thresholdEvents.push(new StockBelowThreshold(input.actorId, line.product));
      }
    }
    order.status = OrderStatus.Delivered;

    // Publish real-time notification events after the transaction commits.
    for (const ev of thresholdEvents) {
      await this.eventBus.publish(ev);
    }
    await this.eventBus.publish(new OrderStatusAdvanced(input.actorId, order.id, OrderStatus.Confirmed, OrderStatus.Delivered));

    return success(order);
  }
}
