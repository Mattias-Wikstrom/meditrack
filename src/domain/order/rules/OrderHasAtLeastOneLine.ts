import { Order } from '../Order';
import { ErrorInfo } from '../../shared/ErrorInfo';
import { OrderRule } from './OrderRule';

export class OrderHasAtLeastOneLine implements OrderRule {
  check(order: Order): ErrorInfo | null {
    if (order.lines.length === 0) {
      return new ErrorInfo('OrderHasAtLeastOneLine');
    }
    return null;
  }
}
