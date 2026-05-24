import { OrderRepository } from '../order/OrderRepository';
import { MedicinalProductRepository } from '../medication/MedicinalProductRepository';
import { AuditRepository } from '../audit/AuditRepository';

// The set of write-capable repositories scoped to one atomic operation.
// Reads that happen before the transaction starts use the regular injected repositories;
// all writes go through here so they commit (or roll back) together with the audit entry.
export interface WriteTransaction {
  orderRepository: OrderRepository;
  medicinalProductRepository: MedicinalProductRepository;
  auditRepository: AuditRepository;
}

export interface Transactor {
  run<T>(work: (tx: WriteTransaction) => Promise<T>): Promise<T>;
}
