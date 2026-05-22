import { Order } from '../../domain/order/Order';
import { OrderRepository } from '../../domain/order/OrderRepository';

export class InMemoryOrderRepository implements OrderRepository {
  private readonly store = new Map<string, Order>();

  findById(id: string): Order | undefined {
    return this.store.get(id);
  }

  findAll(): Order[] {
    return Array.from(this.store.values());
  }

  findByWardUnit(wardUnitId: string): Order[] {
    return Array.from(this.store.values()).filter((o) => o.wardUnitId === wardUnitId);
  }

  save(order: Order): void {
    this.store.set(order.id, order);
  }
}
