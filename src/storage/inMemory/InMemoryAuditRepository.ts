import { AuditEntry } from '../../domain/shared/AuditEntry';
import { AuditRepository } from '../../domain/audit/AuditRepository';

export class InMemoryAuditRepository implements AuditRepository {
  private readonly entries: AuditEntry[] = [];

  async record(entry: AuditEntry): Promise<void> {
    this.entries.push(entry);
  }

  getEntries(): ReadonlyArray<AuditEntry> {
    return this.entries;
  }
}
