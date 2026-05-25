import { createPubSub } from 'graphql-yoga';
import type { DraftOrderCreated } from '../domain/order/events/DraftOrderCreated';
import type { DraftOrderUpdated } from '../domain/order/events/DraftOrderUpdated';
import type { OrderStatusAdvanced } from '../domain/order/events/OrderStatusAdvanced';
import type { StockBelowThreshold } from '../domain/medication/events/StockBelowThreshold';

export const pubSub = createPubSub<{
  DraftOrderCreated: [event: DraftOrderCreated];
  DraftOrderUpdated: [event: DraftOrderUpdated];
  OrderStatusAdvanced: [event: OrderStatusAdvanced];
  StockBelowThreshold: [event: StockBelowThreshold];
}>();
