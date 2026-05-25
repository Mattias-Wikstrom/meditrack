import { AuditEntry } from '../shared/AuditEntry';

export interface AuditFilter {
  actorId?: string;
  entityId?: string;
}

export interface AuditRepository {
  record(entry: AuditEntry): Promise<void>;
  findAll(filter?: AuditFilter): Promise<AuditEntry[]>;
}
