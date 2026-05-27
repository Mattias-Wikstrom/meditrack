import { DeliveryPlan } from '../DeliveryPlan';
import { ErrorInfo } from '../../../shared/results/ErrorInfo';

export interface DeliveryRule {
  check(plan: DeliveryPlan): ErrorInfo | null;
}
