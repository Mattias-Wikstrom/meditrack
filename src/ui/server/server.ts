import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { createYoga } from 'graphql-yoga';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { prisma } from '../../storage/prisma/prismaClient';
import { schema } from '../../api/graphql/schema';
import { PubSubEventBus } from './PubSubEventBus';
import { createWiring } from './wiring';
import { createOrdersRouter } from './rest/orders';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

const eventBus = new PubSubEventBus();
const wiring = createWiring(prisma, eventBus);

const buildContext = (actorId: string) => ({ ...wiring, actorId });

// --- GraphQL over HTTP ---
const yoga = createYoga({
  schema,
  context: ({ request }) => buildContext(request.headers.get('x-actor-id') ?? ''),
});

// --- REST ---
const app = express();
app.use(cors());
app.use('/graphql', yoga);

const api = express.Router();
api.use(express.json());
api.use('/orders', createOrdersRouter(wiring));
app.use('/api', api);

// --- HTTP + WebSocket server ---
const httpServer = createServer(app);

const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
useServer(
  {
    schema,
    context: (ctx) => buildContext((ctx.connectionParams?.actorId as string | undefined) ?? ''),
  },
  wsServer,
);

httpServer.listen(PORT, () => {
  console.log(`GraphQL  http://localhost:${PORT}/graphql`);
  console.log(`REST     http://localhost:${PORT}/api/orders`);
  console.log(`WS       ws://localhost:${PORT}/graphql`);
});
