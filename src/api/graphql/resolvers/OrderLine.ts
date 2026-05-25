import { OrderLine as OrderLineEntity } from '../../../domain/order/OrderLine';
import { GraphQLContext } from '../context';

export const OrderLine = {
  // Each OrderLine resolves its medication on demand.
  // With many lines, replace this with a DataLoader to avoid N+1 queries.
  medication: async (line: OrderLineEntity, _: unknown, ctx: GraphQLContext) =>
    (await ctx.medicationRepo.findById(line.medicationId)) ?? null,
};
