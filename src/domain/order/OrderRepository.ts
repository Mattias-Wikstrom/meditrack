import { Order } from './Order';
import { OrderId, WardUnitId } from '../shared/IdTypes';

export interface OrderRepository {
  findById(id: OrderId): Order | undefined;
  findAll(): Order[];
  findByWardUnit(wardUnitId: WardUnitId): Order[];
  save(order: Order): void;
}
