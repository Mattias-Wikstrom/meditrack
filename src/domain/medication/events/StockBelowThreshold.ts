import Decimal from 'decimal.js';
import { DomainEvent } from '../../shared/DomainEvent';
import { Medication } from '../Medication';

export class StockBelowThreshold implements DomainEvent {
  readonly eventType = 'StockBelowThreshold';
  readonly occurredAt = new Date();
  readonly medicationId: string;
  readonly medicationName: string;
  readonly stockLevel: Decimal;
  readonly stockThreshold: Decimal;

  constructor(
    public readonly actorId: string,
    medication: Medication,
  ) {
    this.medicationId = medication.id;
    this.medicationName = medication.name;
    this.stockLevel = medication.stockLevel;
    this.stockThreshold = medication.stockThreshold;
  }
}
