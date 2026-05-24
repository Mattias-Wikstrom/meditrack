import { MedicinalProduct } from './MedicinalProduct';
import { MedicationId, MedicinalProductId } from '../shared/Id';

export interface MedicinalProductRepository {
  findById(id: MedicinalProductId): MedicinalProduct | undefined;
  findByMedicationId(medicationId: MedicationId): MedicinalProduct[];
  findAll(): MedicinalProduct[];
  save(product: MedicinalProduct): void;
  delete(id: MedicinalProductId): void;
}
