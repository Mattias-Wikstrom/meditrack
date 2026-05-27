import { Medication } from '../Medication';
import { ErrorInfo } from '../../shared/results/ErrorInfo';

export interface MedicationRule {
  check(medication: Medication): ErrorInfo | null;
}
