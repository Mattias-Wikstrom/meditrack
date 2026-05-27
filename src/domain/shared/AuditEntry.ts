export type AuditAction =
  | 'DraftOrderCreated' | 'OrderSent' | 'OrderConfirmed' | 'OrderDelivered'
  | 'ActorLoggedIn' | 'ActorLoginFailed'
  | 'PasswordChanged'
  | 'ProductRestocked'
  | 'ActorCreated' | 'ActorUpdated' | 'ActorDeleted'
  | 'WardUnitCreated' | 'WardUnitUpdated' | 'WardUnitDeleted'
  | 'MedicationCreated' | 'MedicationUpdated' | 'MedicationDeleted'
  | 'MedicinalProductCreated' | 'MedicinalProductUpdated' | 'MedicinalProductDeleted';

export interface AuditEntry {
  actorId: string;
  action: AuditAction;
  entityId: string;
  occurredAt: Date;
}
