import { Order } from '../Order';
import { ErrorInfo } from '../../shared/ErrorInfo';

export interface OrderRule {
  check(order: Order): ErrorInfo | null;
}
