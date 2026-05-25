import { Actor as ActorDomain } from '../../../domain/shared/Actor';
import { GraphQLContext } from '../context';

export const Actor = {
  wardUnit: (actor: ActorDomain, _: unknown, ctx: GraphQLContext) =>
    actor.wardUnitId ? ctx.wardUnitRepo.findById(actor.wardUnitId) : null,
};
