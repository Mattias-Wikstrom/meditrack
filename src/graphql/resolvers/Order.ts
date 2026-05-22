import { Order } from '../../domain/order/Order';

export const Order = {
  createdAt: (order: Order) => order.createdAt.toISOString(),
};
