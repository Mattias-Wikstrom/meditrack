import { createClient, cacheExchange, fetchExchange, subscriptionExchange } from 'urql';
import { createClient as createWsClient } from 'graphql-ws';

const ACTOR_ID = 'nurse-anna';

const wsClient = createWsClient({
  url: 'ws://localhost:4000/graphql',
  connectionParams: { actorId: ACTOR_ID },
});

export const urqlClient = createClient({
  url: 'http://localhost:4000/graphql',
  exchanges: [
    cacheExchange,
    fetchExchange,
    subscriptionExchange({
      forwardSubscription(request) {
        const input = { ...request, query: request.query ?? '' };
        return {
          subscribe(sink) {
            const unsubscribe = wsClient.subscribe(input, sink);
            return { unsubscribe };
          },
        };
      },
    }),
  ],
});
