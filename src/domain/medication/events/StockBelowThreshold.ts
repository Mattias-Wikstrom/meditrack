import { DomainEvent } from '../../shared/eventContracts/DomainEvent';
import { MedicinalProduct } from '../MedicinalProduct';
import { MedicationId, MedicinalProductId } from '../../shared/IdTypes';

export class StockBelowThreshold implements DomainEvent {
  readonly eventType = 'StockBelowThreshold';
  readonly occurredAt = new Date();
  readonly medicinalProductId: MedicinalProductId;
  readonly productName: string;
  readonly medicationId: MedicationId;
  readonly stockLevel: number;
  readonly stockThreshold: number;

  constructor(public readonly actorId: string, product: MedicinalProduct) {
    this.medicinalProductId = product.id;
    this.productName = product.productName;
    this.medicationId = product.medicationId;
    this.stockLevel = product.stockLevel;
    this.stockThreshold = product.stockThreshold;
  }
}
