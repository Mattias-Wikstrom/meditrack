import { Order } from './Order';
import { OrderId, WardUnitId } from '../shared/Id';

export interface OrderRepository {
  findById(id: OrderId): Order | undefined;
  findByWardUnit(wardUnitId: WardUnitId): Order[];
  save(order: Order): void;
}
