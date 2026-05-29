import { Order } from './Order';
import { OrderStatus } from './OrderStatus';
import { OrderId, WardUnitId } from '../shared/IdTypes';

export interface OrderRepository {
  findById(id: OrderId): Promise<Order | undefined>;
  findAll(): Promise<Order[]>;
  findByWardUnit(wardUnitId: WardUnitId): Promise<Order[]>;
  save(order: Order): Promise<void>;
  // Atomically sets status to newStatus, but only if it currently equals expectedStatus.
  // Returns the updated entity. Throws ConflictError if the check fails.
  advanceStatus(id: OrderId, newStatus: OrderStatus, expectedStatus: OrderStatus): Promise<Order>;
}
