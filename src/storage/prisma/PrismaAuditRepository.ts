import { PrismaClient } from '@prisma/client';
import { AuditEntry } from '../../domain/shared/AuditEntry';
import { AuditFilter, AuditRepository } from '../../domain/audit/AuditRepository';

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

  async findAll(filter?: AuditFilter): Promise<AuditEntry[]> {
    const rows = await this.prisma.auditLog.findMany({
      where: {
        ...(filter?.actorId !== undefined && { actorId: filter.actorId }),
        ...(filter?.entityId !== undefined && { entityId: filter.entityId }),
      },
      orderBy: { occurredAt: 'asc' },
    });
    return rows.map((r) => ({
      actorId: r.actorId,
      action: r.action as AuditEntry['action'],
      entityId: r.entityId,
      occurredAt: r.occurredAt,
    }));
  }
}
