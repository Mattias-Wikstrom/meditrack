import { MedicinalProduct } from './MedicinalProduct';
import { MedicationId, MedicinalProductId } from '../shared/IdTypes';

export interface MedicinalProductRepository {
  findById(id: MedicinalProductId): Promise<MedicinalProduct | undefined>;
  findByMedicationId(medicationId: MedicationId): Promise<MedicinalProduct[]>;
  findAll(): Promise<MedicinalProduct[]>;
  save(product: MedicinalProduct): Promise<void>;
  // Atomically sets stockLevel to newLevel, but only if it currently equals expectedLevel.
  // Returns the updated entity. Throws ConflictError if the check fails.
  adjustStock(id: MedicinalProductId, newLevel: number, expectedLevel: number): Promise<MedicinalProduct>;
  delete(id: MedicinalProductId): Promise<void>;
}
