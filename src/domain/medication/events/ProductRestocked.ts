import { DomainEvent } from '../../shared/eventContracts/DomainEvent';
import { MedicinalProduct } from '../MedicinalProduct';
import { MedicinalProductId } from '../../shared/IdTypes';

export class ProductRestocked implements DomainEvent {
  readonly eventType = 'ProductRestocked';
  readonly occurredAt = new Date();
  readonly medicinalProductId: MedicinalProductId;
  readonly productName: string;
  readonly stockLevel: number;

  constructor(
    public readonly actorId: string,
    product: MedicinalProduct,
  ) {
    this.medicinalProductId = product.id;
    this.productName = product.productName;
    this.stockLevel = product.stockLevel;
  }
}
