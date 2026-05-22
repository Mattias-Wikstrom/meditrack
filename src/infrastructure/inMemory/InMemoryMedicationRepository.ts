import { Medication } from '../../domain/medication/Medication';
import { MedicationRepository } from '../../domain/medication/MedicationRepository';

export class InMemoryMedicationRepository implements MedicationRepository {
  private readonly store = new Map<string, Medication>();

  findById(id: string): Medication | undefined {
    return this.store.get(id);
  }

  findAll(): Medication[] {
    return Array.from(this.store.values());
  }

  search(query: string): Medication[] {
    const q = query.toLowerCase();
    return this.findAll().filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.atcCode.toLowerCase().includes(q) ||
        m.form.toLowerCase().includes(q),
    );
  }

  save(medication: Medication): void {
    this.store.set(medication.id, medication);
  }

  delete(id: string): void {
    this.store.delete(id);
  }
}
