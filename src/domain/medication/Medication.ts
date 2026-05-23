import Decimal from 'decimal.js';
import { MedicationForm } from './MedicationForm';
import { MedicationId } from '../shared/Id';

export class Medication {
  public stockLevel: Decimal;
  public readonly stockThreshold: Decimal;

  constructor(
    public readonly id: MedicationId,
    public readonly name: string, // What medication is this?
    public readonly atcCode: string, // What is its ATC code?
    public readonly form: MedicationForm, // Tablet, Capsule, etc.
    public readonly strength: string, // Examples? Why not a number?
    stockLevel: Decimal,
    stockThreshold: Decimal,
  ) {
    this.stockLevel = stockLevel;
    this.stockThreshold = stockThreshold;
  }

  get isBelowThreshold(): boolean {
    return this.stockLevel.lessThan(this.stockThreshold);
  }
}
