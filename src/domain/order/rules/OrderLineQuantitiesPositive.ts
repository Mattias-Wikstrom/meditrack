import { Order } from '../Order';
import { ErrorInfo } from '../../shared/results/ErrorInfo';
import { OrderRule } from './interfaces/OrderRule';

// Each line on an order has to specify a positive quantity of something
// TODO: What about non-integral values? That is fine?
export class OrderLineQuantitiesPositive implements OrderRule {
  check(order: Order): ErrorInfo | null {
    for (const line of order.lines) {
      if (line.quantity <= 0) {
        return new ErrorInfo('OrderLineQuantitiesPositive');
      }
    }
    return null;
  }
}
