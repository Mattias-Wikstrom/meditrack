import { OrderLine as OrderLineEntity } from '../../../domain/order/OrderLine';
import { GraphQLContext } from '../context';

export const OrderLine = {
  quantity: (line: OrderLineEntity) => line.quantity.toNumber(),
  // Each OrderLine resolves its medication on demand.
  // With many lines, replace this with a DataLoader to avoid N+1 queries.
  medication: (line: OrderLineEntity, _: unknown, ctx: GraphQLContext) =>
    ctx.medicationRepo.findById(line.medicationId) ?? null,
};
