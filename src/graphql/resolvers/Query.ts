import { GraphQLContext } from '../context';

export const Query = {
  wardUnit: (_: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
    ctx.wardUnitRepo.findById(id) ?? null,

  medications: (_: unknown, { query }: { query?: string }, ctx: GraphQLContext) =>
    query ? ctx.medicationRepo.search(query) : ctx.medicationRepo.findAll(),

  medication: (_: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
    ctx.medicationRepo.findById(id) ?? null,
};
