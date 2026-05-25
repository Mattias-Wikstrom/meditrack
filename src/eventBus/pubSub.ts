import { createPubSub } from 'graphql-yoga';
import type { OrderPlaced } from '../domain/order/events/OrderPlaced';
import type { OrderStatusAdvanced } from '../domain/order/events/OrderStatusAdvanced';
import type { StockBelowThreshold } from '../domain/medication/events/StockBelowThreshold';

export const pubSub = createPubSub<{
  OrderPlaced: [event: OrderPlaced];
  OrderStatusAdvanced: [event: OrderStatusAdvanced];
  StockBelowThreshold: [event: StockBelowThreshold];
}>();
