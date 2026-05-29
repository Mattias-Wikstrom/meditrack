import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { GraphQLError } from 'graphql';
import { createYoga } from 'graphql-yoga';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { prisma } from '../../storage/prisma/prismaClient';
import { schema } from '../../api/graphql/schema';
import { PubSubEventBus } from './PubSubEventBus';
import { PubSubRepositoryChangeBus } from '../../infrastructure/repositoryChange/PubSubRepositoryChangeBus';
import { createWiring } from './wiring';
import { createOrdersRouter } from './rest/orders';
import { createAuthRouter } from './rest/auth';
import { createActorsRouter } from './rest/actors';
import { createWardUnitsRouter } from './rest/wardUnits';
import { createMedicationsRouter } from './rest/medications';
import { createProductsRouter } from './rest/products';
import { requireAuth } from './middleware/requireAuth';
import { verifyToken } from '../../domain/auth/jwt';

function unauthenticated(message = 'Unauthorized'): GraphQLError {
  return new GraphQLError(message, { extensions: { code: 'UNAUTHENTICATED' } });
}

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

const eventBus = new PubSubEventBus();
const changeBus = new PubSubRepositoryChangeBus();
const wiring = createWiring(prisma, eventBus, changeBus);

const buildContext = (actorId: string) => ({ ...wiring, actorId });

// --- GraphQL over HTTP ---
const yoga = createYoga({
  schema,
  context: async ({ request }) => {
    const auth = request.headers.get('authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
    if (!token) throw unauthenticated();
    try {
      const { actorId } = await verifyToken(token);
      return buildContext(actorId);
    } catch {
      throw unauthenticated('Session expired');
    }
  },
});

// --- REST ---
const app = express();
app.use(cors());
app.use('/graphql', yoga);

const api = express.Router();
api.use(express.json());
api.use('/actors', createActorsRouter(wiring));
api.use('/auth', createAuthRouter());
api.use('/orders', requireAuth, createOrdersRouter(wiring));
api.use('/ward-units', createWardUnitsRouter(wiring));
api.use('/medications', createMedicationsRouter(wiring));
api.use('/products', createProductsRouter(wiring));
app.use('/api', api);

// --- HTTP + WebSocket server ---
const httpServer = createServer(app);

const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
useServer(
  {
    schema,
    onConnect: async (ctx) => {
      const token = ctx.connectionParams?.token as string | undefined;
      if (!token) return false;
      try {
        await verifyToken(token);
        return true;
      } catch {
        return false;
      }
    },
    context: async (ctx) => {
      const token = ctx.connectionParams?.token as string | undefined;
      const { actorId } = await verifyToken(token as string);
      return buildContext(actorId);
    },
  },
  wsServer,
);

prisma.$connect().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`GraphQL  http://localhost:${PORT}/graphql`);
    console.log(`REST     http://localhost:${PORT}/api/orders`);
    console.log(`WS       ws://localhost:${PORT}/graphql`);
  });
});
