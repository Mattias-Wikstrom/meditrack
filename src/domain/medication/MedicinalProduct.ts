import Decimal from 'decimal.js';
import { MedicationId, MedicinalProductId } from '../shared/IdTypes';

export class MedicinalProduct {
  public readonly id: MedicinalProductId;

  /** Brand or trade name of the product (e.g. 'Alvedon', 'Panodil'). */
  public readonly productName: string;

  /** The INN-level medication this product is an instance of. */
  public readonly medicationId: MedicationId;

  /** Current stock in dispensable units (tablets, vials, etc.). */
  public stockLevel: Decimal;

  /** Stock level at or below which a StockBelowThreshold event is raised. */
  public readonly stockThreshold: Decimal;

  constructor(
    id: MedicinalProductId,
    productName: string,
    medicationId: MedicationId,
    stockLevel: Decimal,
    stockThreshold: Decimal,
  ) {
    this.id = id;
    this.productName = productName;
    this.medicationId = medicationId;
    this.stockLevel = stockLevel;
    this.stockThreshold = stockThreshold;
  }

  get isBelowThreshold(): boolean {
    return this.stockLevel.lessThan(this.stockThreshold);
  }
}
