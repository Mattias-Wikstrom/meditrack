import { Medication } from '../Medication';
import { ErrorInfo } from '../../shared/results/ErrorInfo';
import { MedicationRule } from './MedicationRule';

// ATC codes follow the WHO classification system (e.g. N02BE01 for Paracetamol).
// TODO: validate against the full ATC regex pattern.
export class ValidAtcCode implements MedicationRule {
  check(_medication: Medication): ErrorInfo | null {
    return null;
  }
}
