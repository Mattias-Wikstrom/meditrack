import { GraphQLContext } from '../context';

export const Mutation = {
  createOrder: (
    _: unknown,
    { wardUnitId, lines }: { wardUnitId: string; lines: { medicationId: string; quantity: number }[] },
    ctx: GraphQLContext,
  ) => {
    const result = ctx.createOrderUseCase.execute({ actorId: ctx.actorId, wardUnitId, lines });
    return result.successful
      ? { successful: true, order: result.value, errors: [] }
      : { successful: false, order: null, errors: result.errors.map((e) => e.code) };
  },

  advanceOrderStatus: (_: unknown, { orderId }: { orderId: string }, ctx: GraphQLContext) => {
    const result = ctx.advanceOrderStatusUseCase.execute({ actorId: ctx.actorId, orderId });
    return result.successful
      ? { successful: true, order: result.value, errors: [] }
      : { successful: false, order: null, errors: result.errors.map((e) => e.code) };
  },

  deliverOrder: (_: unknown, { orderId }: { orderId: string }, ctx: GraphQLContext) => {
    const result = ctx.deliverOrderUseCase.execute({ actorId: ctx.actorId, orderId });
    return result.successful
      ? { successful: true, order: result.value, errors: [] }
      : { successful: false, order: null, errors: result.errors.map((e) => e.code) };
  },
};
