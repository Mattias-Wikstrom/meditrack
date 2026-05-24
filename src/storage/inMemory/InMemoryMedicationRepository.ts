import { Medication } from '../../domain/medication/Medication';
import { MedicationRepository } from '../../domain/medication/MedicationRepository';
import { MedicationId } from '../../domain/shared/IdTypes';

export class InMemoryMedicationRepository implements MedicationRepository {
  private readonly store = new Map<MedicationId, Medication>();

  async findById(id: MedicationId): Promise<Medication | undefined> {
    return this.store.get(id);
  }

  async findAll(): Promise<Medication[]> {
    return Array.from(this.store.values());
  }

  async search(query: string): Promise<Medication[]> {
    const q = query.toLowerCase();
    return (await this.findAll()).filter(
      (m) =>
        m.innName.toLowerCase().includes(q) ||
        m.atcCode.toLowerCase().includes(q) ||
        m.form.toLowerCase().includes(q),
    );
  }

  async save(medication: Medication): Promise<void> {
    this.store.set(medication.id, medication);
  }

  async delete(id: MedicationId): Promise<void> {
    this.store.delete(id);
  }
}
