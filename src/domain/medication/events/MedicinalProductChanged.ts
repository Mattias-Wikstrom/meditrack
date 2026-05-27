import { DomainEvent } from '../../shared/eventContracts/DomainEvent';
import { MedicationId, MedicinalProductId } from '../../shared/IdTypes';
import { MedicinalProduct } from '../MedicinalProduct';

export class MedicinalProductChanged implements DomainEvent {
  readonly eventType = 'MedicinalProductChanged';
  readonly occurredAt = new Date();
  readonly id: MedicinalProductId;
  readonly productName: string;
  readonly medicationId: MedicationId;
  readonly stockLevel: number;
  readonly stockThreshold: number;
  readonly isBelowThreshold: boolean;

  constructor(product: MedicinalProduct) {
    this.id = product.id;
    this.productName = product.productName;
    this.medicationId = product.medicationId;
    this.stockLevel = product.stockLevel;
    this.stockThreshold = product.stockThreshold;
    this.isBelowThreshold = product.isBelowThreshold;
  }
}
