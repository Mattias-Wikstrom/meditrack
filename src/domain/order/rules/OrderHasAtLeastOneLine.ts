import { Order } from '../Order';
import { ErrorInfo } from '../../shared/results/ErrorInfo';
import { OrderRule } from './interfaces/OrderRule';

// Empty orders are not allowed
export class OrderHasAtLeastOneLine implements OrderRule {
  check(order: Order): ErrorInfo | null {
    if (order.lines.length === 0) {
      return new ErrorInfo('OrderHasAtLeastOneLine');
    }
    return null;
  }
}
