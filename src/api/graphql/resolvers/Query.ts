import { GraphQLContext } from '../context';
import { MedicationId, MedicinalProductId, OrderId, WardUnitId } from '../../../domain/shared/IdTypes';
import { OrderStatus } from '../../../domain/order/OrderStatus';

export const Query = {
  wardUnit: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
    (await ctx.wardUnitRepo.findById(id as WardUnitId)) ?? null,

  orders: async (_: unknown, { status }: { status?: OrderStatus }, ctx: GraphQLContext) => {
    const all = await ctx.orderRepo.findAll();
    return status ? all.filter((o) => o.status === status) : all;
  },

  order: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
    (await ctx.orderRepo.findById(id as OrderId)) ?? null,

  medications: (_: unknown, { query }: { query?: string }, ctx: GraphQLContext) =>
    query ? ctx.medicationRepo.search(query) : ctx.medicationRepo.findAll(),

  medication: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
    (await ctx.medicationRepo.findById(id as MedicationId)) ?? null,

  medicinalProducts: async (_: unknown, { medicationId }: { medicationId?: string }, ctx: GraphQLContext) =>
    medicationId
      ? ctx.medicinalProductRepo.findByMedicationId(medicationId as MedicationId)
      : ctx.medicinalProductRepo.findAll(),

  medicinalProduct: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
    (await ctx.medicinalProductRepo.findById(id as MedicinalProductId)) ?? null,
};
