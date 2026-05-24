import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './typeDefs';
import { Query } from './resolvers/Query';
import { Mutation } from './resolvers/Mutation';
import { WardUnit } from './resolvers/WardUnit';
import { Order } from './resolvers/Order';
import { OrderLine } from './resolvers/OrderLine';
import { Medication } from './resolvers/Medication';
import { MedicinalProduct } from './resolvers/MedicinalProduct';

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers: { Query, Mutation, WardUnit, Order, OrderLine, Medication, MedicinalProduct },
});
