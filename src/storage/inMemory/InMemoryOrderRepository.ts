import { Order } from '../../domain/order/Order';
import { OrderRepository } from '../../domain/order/OrderRepository';
import { OrderId, WardUnitId } from '../../domain/shared/Id';

export class InMemoryOrderRepository implements OrderRepository {
  private readonly store = new Map<OrderId, Order>();

  findById(id: OrderId): Order | undefined {
    return this.store.get(id);
  }

  findAll(): Order[] {
    return Array.from(this.store.values());
  }

  findByWardUnit(wardUnitId: WardUnitId): Order[] {
    return Array.from(this.store.values()).filter((o) => o.wardUnitId === wardUnitId);
  }

  save(order: Order): void {
    this.store.set(order.id, order);
  }
}
