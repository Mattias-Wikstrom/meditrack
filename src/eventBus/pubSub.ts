import { createPubSub } from 'graphql-yoga';
import type { OrderStatusAdvanced } from '../domain/order/events/OrderStatusAdvanced';
import type { StockBelowThreshold } from '../domain/medication/events/StockBelowThreshold';

export const pubSub = createPubSub<{
  OrderStatusAdvanced: [event: OrderStatusAdvanced];
  StockBelowThreshold: [event: StockBelowThreshold];
}>();
