import { MedicationForm } from './MedicationForm';

export class Medication {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly atcCode: string,
    public readonly form: MedicationForm,
    public readonly strength: string,
    public stockLevel: number,
    public readonly stockThreshold: number,
  ) {}

  get isBelowThreshold(): boolean {
    return this.stockLevel < this.stockThreshold;
  }
}
