import { Transactor, WriteTransaction } from '../../domain/shared/Transactor';
import { InMemoryOrderRepository } from './InMemoryOrderRepository';
import { InMemoryMedicinalProductRepository } from './InMemoryMedicinalProductRepository';
import { InMemoryAuditRepository } from './InMemoryAuditRepository';
import { InMemoryActorRepository } from './InMemoryActorRepository';

export class InMemoryTransactor implements Transactor {
  constructor(
    private readonly orderRepository: InMemoryOrderRepository,
    private readonly medicinalProductRepository: InMemoryMedicinalProductRepository,
    readonly auditRepository: InMemoryAuditRepository,
    private readonly actorRepository: InMemoryActorRepository = new InMemoryActorRepository(),
  ) {}

  async run<T>(work: (tx: WriteTransaction) => Promise<T>): Promise<T> {
    return work({
      orderRepository: this.orderRepository,
      medicinalProductRepository: this.medicinalProductRepository,
      auditRepository: this.auditRepository,
      actorRepository: this.actorRepository,
    });
  }
}
