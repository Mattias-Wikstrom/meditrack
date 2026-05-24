import { WardUnit as WardUnitEntity } from '../../../domain/wardUnit/WardUnit';
import { GraphQLContext } from '../context';

export const WardUnit = {
  orders: (wardUnit: WardUnitEntity, _: unknown, ctx: GraphQLContext) =>
    ctx.orderRepo.findByWardUnit(wardUnit.id),
};
