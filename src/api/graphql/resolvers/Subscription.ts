import { pubSub } from '../../../eventBus/pubSub';
import type { OrderStatusAdvanced } from '../../../domain/order/events/OrderStatusAdvanced';
import type { StockBelowThreshold } from '../../../domain/medication/events/StockBelowThreshold';

export const Subscription = {
  orderStatusChanged: {
    subscribe: () => pubSub.subscribe('OrderStatusAdvanced'),
    resolve: (event: OrderStatusAdvanced) => ({
      orderId: event.orderId,
      from: event.from,
      to: event.to,
      actorId: event.actorId,
    }),
  },
  stockBelowThreshold: {
    subscribe: () => pubSub.subscribe('StockBelowThreshold'),
    resolve: (event: StockBelowThreshold) => ({
      medicinalProductId: event.medicinalProductId,
      productName: event.productName,
      medicationId: event.medicationId,
      stockLevel: event.stockLevel,
      stockThreshold: event.stockThreshold,
    }),
  },
};
