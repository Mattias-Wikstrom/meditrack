import { PrismaClient } from '@prisma/client';
import { Transactor, WriteTransaction } from '../../domain/shared/Transactor';
import { PrismaOrderRepository } from './PrismaOrderRepository';
import { PrismaMedicationRepository } from './PrismaMedicationRepository';
import { PrismaMedicinalProductRepository } from './PrismaMedicinalProductRepository';
import { PrismaAuditRepository } from './PrismaAuditRepository';
import { PrismaActorRepository } from './PrismaActorRepository';
import { PrismaWardUnitRepository } from './PrismaWardUnitRepository';

export class PrismaTransactor implements Transactor {
  constructor(private readonly prisma: PrismaClient) {}

  async run<T>(work: (tx: WriteTransaction) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(
      async (prismaTransactionClient) => {
        // The transaction client has all the same model accessors as PrismaClient.
        // The only difference is that lifecycle methods ($connect, $transaction, etc.)
        // are omitted — none of which the repositories use.
        const txClient = prismaTransactionClient as unknown as PrismaClient;
        return work({
          orderRepository: new PrismaOrderRepository(txClient),
          medicationRepository: new PrismaMedicationRepository(txClient),
          medicinalProductRepository: new PrismaMedicinalProductRepository(txClient),
          auditRepository: new PrismaAuditRepository(txClient),
          actorRepository: new PrismaActorRepository(txClient),
          wardUnitRepository: new PrismaWardUnitRepository(txClient),
        });
      },
      { timeout: 30_000 },
    );
  }
}
