import { createClient, cacheExchange, fetchExchange, subscriptionExchange } from 'urql';
import { createClient as createWsClient } from 'graphql-ws';

export function createUrqlClient(actorId: string) {
  const wsClient = createWsClient({
    url: 'ws://localhost:4000/graphql',
    connectionParams: { actorId },
  });

  return createClient({
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
}
