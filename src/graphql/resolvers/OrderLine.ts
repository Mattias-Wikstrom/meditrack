import { OrderLine } from '../../domain/order/OrderLine';
import { GraphQLContext } from '../context';

export const OrderLine = {
  // Each OrderLine resolves its medication on demand.
  // With many lines, replace this with a DataLoader to avoid N+1 queries.
  medication: (line: OrderLine, _: unknown, ctx: GraphQLContext) =>
    ctx.medicationRepo.findById(line.medicationId) ?? null,
};
