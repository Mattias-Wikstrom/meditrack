export type AuditAction =
  | 'OrderPlaced' | 'OrderSent' | 'OrderConfirmed' | 'OrderDelivered'
  | 'ActorLoggedIn' | 'ActorLoginFailed'
  | 'PasswordChanged';

export interface AuditEntry {
  actorId: string;
  action: AuditAction;
  entityId: string;
  occurredAt: Date;
}
