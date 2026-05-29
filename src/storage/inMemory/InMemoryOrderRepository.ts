import { Order } from '../../domain/order/Order';
import { OrderRepository } from '../../domain/order/OrderRepository';
import { OrderStatus } from '../../domain/order/OrderStatus';
import { OrderId, WardUnitId } from '../../domain/shared/IdTypes';
import { ConflictError } from '../../domain/shared/ConflictError';

export class InMemoryOrderRepository implements OrderRepository {
  private readonly store = new Map<OrderId, Order>();

  async findById(id: OrderId): Promise<Order | undefined> {
    return this.store.get(id);
  }

  async findAll(): Promise<Order[]> {
    return Array.from(this.store.values());
  }

  async findByWardUnit(wardUnitId: WardUnitId): Promise<Order[]> {
    return Array.from(this.store.values()).filter((o) => o.wardUnitId === wardUnitId);
  }

  async save(order: Order): Promise<void> {
    this.store.set(order.id, order);
  }

  async advanceStatus(id: OrderId, newStatus: OrderStatus, expectedStatus: OrderStatus): Promise<void> {
    const stored = this.store.get(id);
    if (stored === undefined) throw new Error(`Order ${id} not found`);
    if (stored.status !== expectedStatus) throw new ConflictError();
    stored.status = newStatus;
  }
}
