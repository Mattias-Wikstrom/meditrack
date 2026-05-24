import { Order as OrderEntity } from '../../../domain/order/Order';

export const Order = {
  createdAt: (order: OrderEntity) => order.createdAt.toISOString(),
};
