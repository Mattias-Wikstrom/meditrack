import { MedicinalProduct as MedicinalProductEntity } from '../../../domain/medication/MedicinalProduct';
import { GraphQLContext } from '../context';

export const MedicinalProduct = {
  medication: async (p: MedicinalProductEntity, _: unknown, ctx: GraphQLContext) =>
    (await ctx.medicationRepo.findById(p.medicationId)) ?? null,
};
