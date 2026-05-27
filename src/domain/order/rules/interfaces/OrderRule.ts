import { Order } from '../../Order';
import { ErrorInfo } from '../../../shared/results/ErrorInfo';

export interface OrderRule {
  check(order: Order): ErrorInfo | null;
}
