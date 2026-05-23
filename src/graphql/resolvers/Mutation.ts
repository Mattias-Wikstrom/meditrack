import { GraphQLContext } from '../context';
import { MedicationId, OrderId, WardUnitId } from '../../domain/shared/Id';

export const Mutation = {
  createOrder: (
    _: unknown,
    { wardUnitId, lines }: { wardUnitId: string; lines: { medicationId: string; quantity: number }[] },
    ctx: GraphQLContext,
  ) => {
    const result = ctx.createOrderUseCase.execute({
      actorId: ctx.actorId,
      wardUnitId: wardUnitId as WardUnitId,
      lines: lines.map((l) => ({ medicationId: l.medicationId as MedicationId, quantity: l.quantity })),
    });
    return result.successful
      ? { successful: true, order: result.value, errors: [] }
      : { successful: false, order: null, errors: result.errors.map((e) => e.code) };
  },

  advanceOrderStatus: (_: unknown, { orderId }: { orderId: string }, ctx: GraphQLContext) => {
    const result = ctx.advanceOrderStatusUseCase.execute({ actorId: ctx.actorId, orderId: orderId as OrderId });
    return result.successful
      ? { successful: true, order: result.value, errors: [] }
      : { successful: false, order: null, errors: result.errors.map((e) => e.code) };
  },

  deliverOrder: (_: unknown, { orderId }: { orderId: string }, ctx: GraphQLContext) => {
    const result = ctx.deliverOrderUseCase.execute({ actorId: ctx.actorId, orderId: orderId as OrderId });
    return result.successful
      ? { successful: true, order: result.value, errors: [] }
      : { successful: false, order: null, errors: result.errors.map((e) => e.code) };
  },
};
