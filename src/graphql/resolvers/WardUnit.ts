import { WardUnit } from '../../domain/wardUnit/WardUnit';
import { GraphQLContext } from '../context';

export const WardUnit = {
  orders: (wardUnit: WardUnit, _: unknown, ctx: GraphQLContext) =>
    ctx.orderRepo.findByWardUnit(wardUnit.id),
};
