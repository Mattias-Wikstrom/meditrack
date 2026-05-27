import { ErrorInfo } from '../../../shared/results/ErrorInfo';

export interface RestockRule {
  check(quantity: number): ErrorInfo | null;
}
