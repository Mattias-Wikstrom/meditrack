import { OrderRepository } from '../order/OrderRepository';
import { MedicationRepository } from '../medication/MedicationRepository';
import { MedicinalProductRepository } from '../medication/MedicinalProductRepository';
import { AuditRepository } from '../audit/AuditRepository';
import { ActorRepository } from '../actor/ActorRepository';
import { WardUnitRepository } from '../wardUnit/WardUnitRepository';

// The set of write-capable repositories scoped to one atomic operation.
// Reads that happen before the transaction starts use the regular injected repositories;
// all writes go through here so they commit (or roll back) together with the audit entry.
export interface WriteTransaction {
  orderRepository: OrderRepository;
  medicationRepository: MedicationRepository;
  medicinalProductRepository: MedicinalProductRepository;
  auditRepository: AuditRepository;
  actorRepository: ActorRepository;
  wardUnitRepository: WardUnitRepository;
}

export interface Transactor {
  run<T>(work: (tx: WriteTransaction) => Promise<T>): Promise<T>;
}
