import { DeliveryPlan } from './DeliveryPlan';
import { ErrorInfo } from '../../shared/results/ErrorInfo';
import { DeliveryRule } from './interfaces/DeliveryRule';
import { OrderStatus } from '../OrderStatus';

export class OrderMustBeConfirmed implements DeliveryRule {
  check(plan: DeliveryPlan): ErrorInfo | null {
    if (plan.order.status !== OrderStatus.Confirmed) {
      return new ErrorInfo('InvalidStatusTransition');
    }
    return null;
  }
}
