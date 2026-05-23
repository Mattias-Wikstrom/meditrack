import { Medication } from './Medication';
import { MedicationId } from '../shared/Id';

export interface MedicationRepository {
  findById(id: MedicationId): Medication | undefined;
  findAll(): Medication[];
  search(query: string): Medication[];
  save(medication: Medication): void;
  delete(id: MedicationId): void;
}
