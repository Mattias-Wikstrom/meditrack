import { Medication } from '../Medication';
import { ErrorInfo } from '../../shared/results/ErrorInfo';
import { MedicationRule } from './interfaces/MedicationRule';

// WHO ATC code format example: N02BE01
const ATC_CODE_REGEX = /^[A-Z]\d{2}[A-Z]{2}\d{2}$/;

export class ValidAtcCode implements MedicationRule {
  check(medication: Medication): ErrorInfo | null {
    if (!ATC_CODE_REGEX.test(medication.atcCode)) {
      return new ErrorInfo('InvalidATCCode');
    }

    return null;
  }
}