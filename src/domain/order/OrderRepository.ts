import { Order } from './Order';
import { OrderId, WardUnitId } from '../shared/IdTypes';

export interface OrderRepository {
  findById(id: OrderId): Promise<Order | undefined>;
  findAll(): Promise<Order[]>;
  findByWardUnit(wardUnitId: WardUnitId): Promise<Order[]>;
  save(order: Order): Promise<void>;
}
