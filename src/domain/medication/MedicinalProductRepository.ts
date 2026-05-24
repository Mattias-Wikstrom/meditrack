import { MedicinalProduct } from './MedicinalProduct';
import { MedicationId, MedicinalProductId } from '../shared/IdTypes';

export interface MedicinalProductRepository {
  findById(id: MedicinalProductId): Promise<MedicinalProduct | undefined>;
  findByMedicationId(medicationId: MedicationId): Promise<MedicinalProduct[]>;
  findAll(): Promise<MedicinalProduct[]>;
  save(product: MedicinalProduct): Promise<void>;
  delete(id: MedicinalProductId): Promise<void>;
}
