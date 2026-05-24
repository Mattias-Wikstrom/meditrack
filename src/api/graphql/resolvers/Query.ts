import { GraphQLContext } from '../context';
import { MedicationId, MedicinalProductId, WardUnitId } from '../../../domain/shared/IdTypes';

export const Query = {
  wardUnit: (_: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
    ctx.wardUnitRepo.findById(id as WardUnitId) ?? null,

  medications: (_: unknown, { query }: { query?: string }, ctx: GraphQLContext) =>
    query ? ctx.medicationRepo.search(query) : ctx.medicationRepo.findAll(),

  medication: (_: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
    ctx.medicationRepo.findById(id as MedicationId) ?? null,

  medicinalProducts: (_: unknown, __: unknown, ctx: GraphQLContext) =>
    ctx.medicinalProductRepo.findAll(),

  medicinalProduct: (_: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
    ctx.medicinalProductRepo.findById(id as MedicinalProductId) ?? null,
};
