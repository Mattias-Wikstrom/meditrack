import { ErrorInfo } from '../../shared/results/ErrorInfo';
import { RestockRule } from './RestockRule';

// The quantity added to stock during a restock must be greater than zero
export class RestockQuantityPositive implements RestockRule {
  check(quantity: number): ErrorInfo | null {
    if (quantity <= 0) {
      return new ErrorInfo('InvalidQuantity');
    }
    return null;
  }
}
