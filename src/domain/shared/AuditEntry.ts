export type AuditAction = 'OrderPlaced' | 'OrderSent' | 'OrderConfirmed' | 'OrderDelivered';

export interface AuditEntry {
  actorId: string;
  action: AuditAction;
  entityId: string;
  occurredAt: Date;
}
