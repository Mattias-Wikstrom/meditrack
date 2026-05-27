import { pubSub } from '../../../eventBus/pubSub';
import { changePubSub } from '../../../infrastructure/repositoryChange/changePubSub';
import type { RepositoryChange } from '../../../infrastructure/repositoryChange/RepositoryChangeBus';
import type { MedicinalProduct } from '../../../domain/medication/MedicinalProduct';
import type { DraftOrderCreated } from '../../../domain/order/events/DraftOrderCreated';
import type { DraftOrderUpdated } from '../../../domain/order/events/DraftOrderUpdated';
import type { OrderStatusAdvanced } from '../../../domain/order/events/OrderStatusAdvanced';
import type { StockBelowThreshold } from '../../../domain/medication/events/StockBelowThreshold';
import type { ProductRestocked } from '../../../domain/medication/events/ProductRestocked';

async function* savedEntities<T>(
  source: AsyncIterable<RepositoryChange<T>>,
): AsyncIterable<T> {
  for await (const change of source) {
    if (change.kind === 'saved') yield change.entity;
  }
}

export const Subscription = {
  orderDraftCreated: {
    subscribe: () => pubSub.subscribe('DraftOrderCreated'),
    resolve: (event: DraftOrderCreated) => ({
      orderId: event.order.id,
      wardUnitId: event.order.wardUnitId,
      actorId: event.actorId,
    }),
  },
  orderDraftUpdated: {
    subscribe: () => pubSub.subscribe('DraftOrderUpdated'),
    resolve: (event: DraftOrderUpdated) => ({
      orderId: event.order.id,
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
  productRestocked: {
    subscribe: () => pubSub.subscribe('ProductRestocked'),
    resolve: (event: ProductRestocked) => ({
      medicinalProductId: event.medicinalProductId,
      productName: event.productName,
      stockLevel: event.stockLevel,
    }),
  },
  medicinalProductUpdated: {
    subscribe: () => savedEntities<MedicinalProduct>(changePubSub.subscribe('MedicinalProduct')),
    resolve: (entity: MedicinalProduct) => entity,
  },
  repositoryChanged: {
    subscribe: () => changePubSub.subscribe('__all__'),
    resolve: (change: RepositoryChange<any>) => ({
      entityType: change.entityType,
      kind: change.kind,
      entityId: change.kind === 'saved' ? String((change.entity as any).id) : String(change.id),
    }),
  },
};
