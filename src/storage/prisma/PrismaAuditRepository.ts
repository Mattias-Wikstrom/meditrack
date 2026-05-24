import { PrismaClient } from '@prisma/client';
import { AuditEntry } from '../../domain/shared/AuditEntry';
import { AuditRepository } from '../../domain/audit/AuditRepository';

export class PrismaAuditRepository implements AuditRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async record(entry: AuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        entityId: entry.entityId,
        occurredAt: entry.occurredAt,
      },
    });
  }
}
