import { Transactor, WriteTransaction } from '../../domain/shared/Transactor';
import { InMemoryOrderRepository } from './InMemoryOrderRepository';
import { InMemoryMedicinalProductRepository } from './InMemoryMedicinalProductRepository';
import { InMemoryAuditRepository } from './InMemoryAuditRepository';

export class InMemoryTransactor implements Transactor {
  constructor(
    private readonly orderRepository: InMemoryOrderRepository,
    private readonly medicinalProductRepository: InMemoryMedicinalProductRepository,
    readonly auditRepository: InMemoryAuditRepository,
  ) {}

  async run<T>(work: (tx: WriteTransaction) => Promise<T>): Promise<T> {
    return work({
      orderRepository: this.orderRepository,
      medicinalProductRepository: this.medicinalProductRepository,
      auditRepository: this.auditRepository,
    });
  }
}
