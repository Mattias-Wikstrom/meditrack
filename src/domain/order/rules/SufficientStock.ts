import { DeliveryPlan } from './DeliveryPlan';
import { ErrorInfo } from '../../shared/results/ErrorInfo';
import { DeliveryRule } from './DeliveryRule';

export class SufficientStock implements DeliveryRule {
  check(plan: DeliveryPlan): ErrorInfo | null {
    for (const line of plan.resolvedLines) {
      if (line.product.stockLevel.lessThan(line.quantity)) {
        return new ErrorInfo('InsufficientStock');
      }
    }
    return null;
  }
}
