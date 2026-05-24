import { MedicinalProduct as MedicinalProductEntity } from '../../domain/medication/MedicinalProduct';
import { GraphQLContext } from '../context';

export const MedicinalProduct = {
  stockLevel: (p: MedicinalProductEntity) => p.stockLevel.toNumber(),
  stockThreshold: (p: MedicinalProductEntity) => p.stockThreshold.toNumber(),
  medication: (p: MedicinalProductEntity, _: unknown, ctx: GraphQLContext) =>
    ctx.medicationRepo.findById(p.medicationId) ?? null,
};
