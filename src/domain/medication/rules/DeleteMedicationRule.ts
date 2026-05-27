import { Medication } from '../Medication';
import { MedicinalProduct } from '../MedicinalProduct';
import { ErrorInfo } from '../../shared/results/ErrorInfo';

export interface DeleteMedicationRule {
  check(medication: Medication, products: MedicinalProduct[]): ErrorInfo | null;
}
