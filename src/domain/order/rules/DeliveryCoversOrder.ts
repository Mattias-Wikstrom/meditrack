import Decimal from 'decimal.js';
import { DeliveryPlan } from './DeliveryPlan';
import { ErrorInfo } from '../../shared/results/ErrorInfo';
import { DeliveryRule } from './DeliveryRule';

export class DeliveryCoversOrder implements DeliveryRule {
  check(plan: DeliveryPlan): ErrorInfo | null {
    for (const orderLine of plan.order.lines) {
      const selectionsForLine = plan.resolvedLines.filter(
        (l) => l.medicationId === orderLine.medicationId,
      );

      for (const selection of selectionsForLine) {
        if (selection.product.medicationId !== orderLine.medicationId) {
          return new ErrorInfo('ProductMedicationMismatch');
        }
      }

      const totalSelected = selectionsForLine.reduce(
        (sum, l) => sum.add(l.quantity),
        new Decimal(0),
      );
      if (!totalSelected.equals(orderLine.quantity)) {
        return new ErrorInfo('SelectionQuantityMismatch');
      }
    }
    return null;
  }
}
