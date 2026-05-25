import { AuditEntry } from '../../domain/shared/AuditEntry';
import { AuditFilter, AuditRepository } from '../../domain/audit/AuditRepository';

export class InMemoryAuditRepository implements AuditRepository {
  private readonly entries: AuditEntry[] = [];

  async record(entry: AuditEntry): Promise<void> {
    this.entries.push(entry);
  }

  async findAll(filter?: AuditFilter): Promise<AuditEntry[]> {
    return this.entries.filter(
      (e) =>
        (filter?.actorId === undefined || e.actorId === filter.actorId) &&
        (filter?.entityId === undefined || e.entityId === filter.entityId),
    );
  }

  getEntries(): ReadonlyArray<AuditEntry> {
    return this.entries;
  }
}
