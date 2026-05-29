import { MedicinalProduct } from '../../domain/medication/MedicinalProduct';
import { MedicinalProductRepository } from '../../domain/medication/MedicinalProductRepository';
import { MedicationId, MedicinalProductId } from '../../domain/shared/IdTypes';
import { ConflictError } from '../../domain/shared/ConflictError';

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

  async adjustStock(id: MedicinalProductId, newLevel: number, expectedLevel: number): Promise<MedicinalProduct> {
    const stored = this.store.get(id);
    if (stored === undefined) throw new Error(`MedicinalProduct ${id} not found`);
    if (stored.stockLevel !== expectedLevel) throw new ConflictError();
    stored.stockLevel = newLevel;
    return stored;
  }

  async delete(id: MedicinalProductId): Promise<void> {
    this.store.delete(id);
  }
}
