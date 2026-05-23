import Decimal from 'decimal.js';
import { MedicationForm } from './MedicationForm';

export class Medication {
  public stockLevel: Decimal;
  public readonly stockThreshold: Decimal;

  constructor(
    public readonly id: string,
    public readonly name: string, // What medication is this?
    public readonly atcCode: string, // What is its ATC code?
    public readonly form: MedicationForm, // Tablet, Capsule, etc.
    public readonly strength: string, // Examples? Why not a number?
    stockLevel: number,
    stockThreshold: number,
  ) {
    this.stockLevel = new Decimal(stockLevel);
    this.stockThreshold = new Decimal(stockThreshold);
  }

  get isBelowThreshold(): boolean {
    return this.stockLevel.lessThan(this.stockThreshold);
  }
}
