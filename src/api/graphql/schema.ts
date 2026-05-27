import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './typeDefs';
import { Query } from './resolvers/Query';
import { WardUnit } from './resolvers/WardUnit';
import { Actor } from './resolvers/Actor';
import { Order } from './resolvers/Order';
import { OrderLine } from './resolvers/OrderLine';
import { Medication } from './resolvers/Medication';
import { MedicinalProduct } from './resolvers/MedicinalProduct';
import { Subscription } from './resolvers/Subscription';

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers: { Query, Subscription, WardUnit, Actor, Order, OrderLine, Medication, MedicinalProduct },
});
