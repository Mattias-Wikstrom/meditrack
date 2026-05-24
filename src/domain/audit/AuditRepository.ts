import { AuditEntry } from '../shared/AuditEntry';

export interface AuditRepository {
  record(entry: AuditEntry): Promise<void>;
}
