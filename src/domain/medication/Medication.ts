import { MedicationForm } from './MedicationForm';

export class Medication {
  constructor(
    public readonly id: string,
    public readonly name: string, // What medication is this?
    public readonly atcCode: string, // What is its ATC code?
    public readonly form: MedicationForm, // Tablet, Capsule, etc.
    public readonly strength: string, // Examples? Why not a number?
    public stockLevel: number, // An integer?
    public readonly stockThreshold: number,
  ) {}

  get isBelowThreshold(): boolean {
    return this.stockLevel < this.stockThreshold;
  }
}
