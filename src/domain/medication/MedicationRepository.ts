import { Medication } from './Medication';

export interface MedicationRepository {
  findById(id: string): Medication | undefined;
  findAll(): Medication[];
  search(query: string): Medication[];
  save(medication: Medication): void;
  delete(id: string): void;
}
