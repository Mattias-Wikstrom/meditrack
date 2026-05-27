import { Medication } from '../Medication';
import { MedicinalProduct } from '../MedicinalProduct';
import { ErrorInfo } from '../../shared/results/ErrorInfo';
import { DeleteMedicationRule } from './DeleteMedicationRule';

// A medication cannot be deleted while it still has registered medicinal products
export class MedicationHasNoProducts implements DeleteMedicationRule {
  check(_medication: Medication, products: MedicinalProduct[]): ErrorInfo | null {
    if (products.length > 0) {
      return new ErrorInfo('MedicationHasProducts');
    }
    return null;
  }
}
