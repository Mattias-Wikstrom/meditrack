import { Order } from '../Order';
import { ErrorInfo } from '../../shared/ErrorInfo';
import { OrderRule } from './OrderRule';

export class OrderLineQuantitiesPositive implements OrderRule {
  check(order: Order): ErrorInfo | null {
    for (const line of order.lines) {
      if (line.quantity <= 0) {
        return new ErrorInfo(
          'OrderLineQuantitiesPositive',
          `Quantity for medication '${line.medicationId}' must be a positive number.`,
        );
      }
    }
    return null;
  }
}
