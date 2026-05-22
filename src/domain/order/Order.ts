import { OrderLine } from './OrderLine';
import { OrderStatus } from './OrderStatus';

export class Order {
  constructor(
    public readonly id: string,
    public readonly wardUnitId: string,
    public readonly lines: OrderLine[],
    public status: OrderStatus,
    public readonly createdAt: Date,
  ) {}
}
