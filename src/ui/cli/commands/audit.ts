import { AuditRepository } from '../../../domain/audit/AuditRepository';
import { CliOutput } from '../CliOutput';

export async function listAudit(
  repo: AuditRepository,
  output: CliOutput,
  filter: { actorId?: string; orderId?: string },
): Promise<void> {
  const entries = await repo.findAll({
    ...(filter.actorId !== undefined && { actorId: filter.actorId }),
    ...(filter.orderId !== undefined && { entityId: filter.orderId }),
  });

  if (entries.length === 0) {
    output.print('No audit entries.');
    return;
  }

  for (const entry of entries) {
    output.print(
      `${entry.occurredAt.toISOString()}  ${entry.actorId.padEnd(24)} ${entry.action.padEnd(16)} ${entry.entityId}`,
    );
  }
}
