import { OrderLine } from './OrderLine';
import { OrderStatus } from './OrderStatus';
import { OrderId, WardUnitId } from '../shared/Id';

export class Order {
  constructor(
    public readonly id: OrderId,
    public readonly wardUnitId: WardUnitId,
    public readonly lines: OrderLine[],
    public status: OrderStatus,
    public readonly createdAt: Date,
  ) {}
}
