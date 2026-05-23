import Decimal from 'decimal.js';
import { MedicationId } from '../shared/Id';

export class OrderLine {
  public readonly quantity: Decimal;

  constructor(
    public readonly medicationId: MedicationId,
    quantity: number,
  ) {
    this.quantity = new Decimal(quantity);
  }
}
