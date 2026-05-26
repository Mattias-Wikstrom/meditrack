import { Order as OrderEntity } from '../../../domain/order/Order';
import { GraphQLContext } from '../context';

export const Order = {
  createdAt: (order: OrderEntity) => order.createdAt.toISOString(),
  wardUnit: (order: OrderEntity, _: unknown, ctx: GraphQLContext) =>
    ctx.wardUnitRepo.findById(order.wardUnitId),
};
