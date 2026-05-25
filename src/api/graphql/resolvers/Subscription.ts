import { pubSub } from '../../../eventBus/pubSub';
import type { OrderPlaced } from '../../../domain/order/events/OrderPlaced';
import type { OrderStatusAdvanced } from '../../../domain/order/events/OrderStatusAdvanced';
import type { StockBelowThreshold } from '../../../domain/medication/events/StockBelowThreshold';

export const Subscription = {
  orderPlaced: {
    subscribe: () => pubSub.subscribe('OrderPlaced'),
    resolve: (event: OrderPlaced) => ({
      orderId: event.order.id,
      wardUnitId: event.order.wardUnitId,
      actorId: event.actorId,
    }),
  },
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
