import { GraphQLContext } from '../context';
import { MedicationId, MedicinalProductId, OrderId } from '../../../domain/shared/IdTypes';


export const Mutation = {
  createOrder: async (
    _: unknown,
    { lines }: { lines: { medicationId: string; quantity: number }[] },
    ctx: GraphQLContext,
  ) => {
    const result = await ctx.createOrderUseCase.execute({
      actorId: ctx.actorId,
      lines: lines.map((l) => ({ medicationId: l.medicationId as MedicationId, quantity: l.quantity })),
    });
    return result.successful
      ? { successful: true, order: result.value, errors: [] }
      : { successful: false, order: null, errors: result.errors.map((e) => e.code) };
  },

  updateOrderLines: async (
    _: unknown,
    { orderId, lines }: { orderId: string; lines: { medicationId: string; quantity: number }[] },
    ctx: GraphQLContext,
  ) => {
    const result = await ctx.updateOrderLinesUseCase.execute({
      actorId: ctx.actorId,
      orderId: orderId as OrderId,
      lines: lines.map((l) => ({ medicationId: l.medicationId as MedicationId, quantity: l.quantity })),
    });
    return result.successful
      ? { successful: true, order: result.value, errors: [] }
      : { successful: false, order: null, errors: result.errors.map((e) => e.code) };
  },

  sendOrder: async (_: unknown, { orderId }: { orderId: string }, ctx: GraphQLContext) => {
    const result = await ctx.sendOrderUseCase.execute({
      actorId: ctx.actorId,
      orderId: orderId as OrderId,
    });
    return result.successful
      ? { successful: true, order: result.value, errors: [] }
      : { successful: false, order: null, errors: result.errors.map((e) => e.code) };
  },

  confirmOrder: async (_: unknown, { orderId }: { orderId: string }, ctx: GraphQLContext) => {
    const result = await ctx.confirmOrderUseCase.execute({
      actorId: ctx.actorId,
      orderId: orderId as OrderId,
    });
    return result.successful
      ? { successful: true, order: result.value, errors: [] }
      : { successful: false, order: null, errors: result.errors.map((e) => e.code) };
  },

  deliverOrder: async (
    _: unknown,
    { orderId, productSelections }: { orderId: string; productSelections: { medicationId: string; medicinalProductId: string; quantity: number }[] },
    ctx: GraphQLContext,
  ) => {
    const result = await ctx.deliverOrderUseCase.execute({
      actorId: ctx.actorId,
      orderId: orderId as OrderId,
      productSelections: productSelections.map((s) => ({
        medicationId: s.medicationId as MedicationId,
        medicinalProductId: s.medicinalProductId as MedicinalProductId,
        quantity: s.quantity,
      })),
    });
    return result.successful
      ? { successful: true, order: result.value, errors: [] }
      : { successful: false, order: null, errors: result.errors.map((e) => e.code) };
  },

  restockProduct: async (
    _: unknown,
    { medicinalProductId, quantity }: { medicinalProductId: string; quantity: number },
    ctx: GraphQLContext,
  ) => {
    const result = await ctx.restockUseCase.execute({
      actorId: ctx.actorId,
      medicinalProductId: medicinalProductId as MedicinalProductId,
      quantity,
    });
    return result.successful
      ? { successful: true, product: result.value, errors: [] }
      : { successful: false, product: null, errors: result.errors.map((e) => e.code) };
  },
};
