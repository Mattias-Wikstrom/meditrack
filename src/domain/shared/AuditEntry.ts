export type AuditAction =
  | 'DraftOrderCreated' | 'OrderSent' | 'OrderConfirmed' | 'OrderDelivered'
  | 'ActorLoggedIn' | 'ActorLoginFailed'
  | 'PasswordChanged'
  | 'ProductRestocked'
  | 'ActorCreated' | 'ActorUpdated' | 'ActorDeleted';

export interface AuditEntry {
  actorId: string;
  action: AuditAction;
  entityId: string;
  occurredAt: Date;
}
