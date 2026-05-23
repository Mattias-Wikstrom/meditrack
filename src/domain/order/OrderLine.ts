import Decimal from 'decimal.js';

export class OrderLine {
  public readonly quantity: Decimal;

  constructor(
    public readonly medicationId: string,
    quantity: number,
  ) {
    this.quantity = new Decimal(quantity);
  }
}
