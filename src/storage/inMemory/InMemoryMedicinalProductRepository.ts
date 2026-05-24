import { MedicinalProduct } from '../../domain/medication/MedicinalProduct';
import { MedicinalProductRepository } from '../../domain/medication/MedicinalProductRepository';
import { MedicationId, MedicinalProductId } from '../../domain/shared/IdTypes';

export class InMemoryMedicinalProductRepository implements MedicinalProductRepository {
  private readonly store = new Map<MedicinalProductId, MedicinalProduct>();

  async findById(id: MedicinalProductId): Promise<MedicinalProduct | undefined> {
    return this.store.get(id);
  }

  async findByMedicationId(medicationId: MedicationId): Promise<MedicinalProduct[]> {
    return Array.from(this.store.values()).filter((p) => p.medicationId === medicationId);
  }

  async findAll(): Promise<MedicinalProduct[]> {
    return Array.from(this.store.values());
  }

  async save(product: MedicinalProduct): Promise<void> {
    this.store.set(product.id, product);
  }

  async delete(id: MedicinalProductId): Promise<void> {
    this.store.delete(id);
  }
}
