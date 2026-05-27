import { PrismaClient } from '@prisma/client';
import { Transactor, WriteTransaction } from '../../domain/shared/Transactor';
import { PrismaOrderRepository } from './PrismaOrderRepository';
import { PrismaMedicationRepository } from './PrismaMedicationRepository';
import { PrismaMedicinalProductRepository } from './PrismaMedicinalProductRepository';
import { PrismaAuditRepository } from './PrismaAuditRepository';
import { PrismaActorRepository } from './PrismaActorRepository';
import { PrismaWardUnitRepository } from './PrismaWardUnitRepository';
import { observing } from '../../infrastructure/repositoryChange/observing';
import type { RepositoryChange, RepositoryChangeBus } from '../../infrastructure/repositoryChange/RepositoryChangeBus';

export class PrismaTransactor implements Transactor {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly changeBus: RepositoryChangeBus,
  ) {}

  async run<T>(work: (tx: WriteTransaction) => Promise<T>): Promise<T> {
    const pending: RepositoryChange<any>[] = [];
    const buffer: RepositoryChangeBus = { publish: c => pending.push(c) };

    const result = await this.prisma.$transaction(
      async (prismaTransactionClient) => {
        const txClient = prismaTransactionClient as unknown as PrismaClient;
        return work({
          orderRepository: observing(new PrismaOrderRepository(txClient), 'Order', buffer),
          medicationRepository: observing(new PrismaMedicationRepository(txClient), 'Medication', buffer),
          medicinalProductRepository: observing(new PrismaMedicinalProductRepository(txClient), 'MedicinalProduct', buffer),
          auditRepository: new PrismaAuditRepository(txClient),
          actorRepository: observing(new PrismaActorRepository(txClient), 'Actor', buffer),
          wardUnitRepository: observing(new PrismaWardUnitRepository(txClient), 'WardUnit', buffer),
        });
      },
      { timeout: 30_000 },
    );

    for (const change of pending) {
      this.changeBus.publish(change);
    }

    return result;
  }
}
