import { Order } from './Order';

export interface OrderRepository {
  findById(id: string): Order | undefined;
  findByWardUnit(wardUnitId: string): Order[];
  save(order: Order): void;
}
