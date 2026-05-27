import { Transactor, WriteTransaction } from '../../domain/shared/Transactor';
import { InMemoryOrderRepository } from './InMemoryOrderRepository';
import { InMemoryMedicationRepository } from './InMemoryMedicationRepository';
import { InMemoryMedicinalProductRepository } from './InMemoryMedicinalProductRepository';
import { InMemoryAuditRepository } from './InMemoryAuditRepository';
import { InMemoryActorRepository } from './InMemoryActorRepository';
import { InMemoryWardUnitRepository } from './InMemoryWardUnitRepository';

export class InMemoryTransactor implements Transactor {
  constructor(
    private readonly orderRepository: InMemoryOrderRepository,
    private readonly medicinalProductRepository: InMemoryMedicinalProductRepository,
    readonly auditRepository: InMemoryAuditRepository,
    private readonly actorRepository: InMemoryActorRepository = new InMemoryActorRepository(),
    private readonly wardUnitRepository: InMemoryWardUnitRepository = new InMemoryWardUnitRepository(),
    private readonly medicationRepository: InMemoryMedicationRepository = new InMemoryMedicationRepository(),
  ) {}

  async run<T>(work: (tx: WriteTransaction) => Promise<T>): Promise<T> {
    return work({
      orderRepository: this.orderRepository,
      medicationRepository: this.medicationRepository,
      medicinalProductRepository: this.medicinalProductRepository,
      auditRepository: this.auditRepository,
      actorRepository: this.actorRepository,
      wardUnitRepository: this.wardUnitRepository,
    });
  }
}
