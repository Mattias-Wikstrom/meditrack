import { MedicinalProduct } from '../../domain/medication/MedicinalProduct';
import { MedicinalProductRepository } from '../../domain/medication/MedicinalProductRepository';
import { MedicationId, MedicinalProductId } from '../../domain/shared/IdTypes';

export class InMemoryMedicinalProductRepository implements MedicinalProductRepository {
  private readonly store = new Map<MedicinalProductId, MedicinalProduct>();

  findById(id: MedicinalProductId): MedicinalProduct | undefined {
    return this.store.get(id);
  }

  findByMedicationId(medicationId: MedicationId): MedicinalProduct[] {
    return Array.from(this.store.values()).filter((p) => p.medicationId === medicationId);
  }

  findAll(): MedicinalProduct[] {
    return Array.from(this.store.values());
  }

  save(product: MedicinalProduct): void {
    this.store.set(product.id, product);
  }

  delete(id: MedicinalProductId): void {
    this.store.delete(id);
  }
}
