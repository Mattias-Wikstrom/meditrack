import { Medication } from './Medication';
import { MedicationId } from '../shared/IdTypes';

export interface MedicationRepository {
  findById(id: MedicationId): Promise<Medication | undefined>;
  findAll(): Promise<Medication[]>;
  search(query: string): Promise<Medication[]>;
  save(medication: Medication): Promise<void>;
  delete(id: MedicationId): Promise<void>;
}
