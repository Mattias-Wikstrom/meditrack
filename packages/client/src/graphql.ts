import { createClient, fetchExchange, mapExchange, subscriptionExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache';
import { gql } from '@urql/core';
import { createClient as createWsClient } from 'graphql-ws';

export function createUrqlClient(token: string, onUnauthenticated: () => void) {
  const wsClient = createWsClient({
    url: 'ws://localhost:4000/graphql',
    connectionParams: { token },
  });

  return createClient({
    url: 'http://localhost:4000/graphql',
    fetchOptions: () => ({
      headers: { Authorization: `Bearer ${token}` },
    }),
    exchanges: [
      mapExchange({
        onError(error) {
          const isAuthError = error.graphQLErrors.some(
            e => e.extensions?.code === 'UNAUTHENTICATED',
          );
          if (isAuthError) onUnauthenticated();
        },
      }),
      cacheExchange({
        keys: {
          MedicinalProduct: (data) => (data as { id?: string }).id ?? null,
          Medication: (data) => (data as { id?: string }).id ?? null,
          Order: (data) => (data as { id?: string }).id ?? null,
          WardUnit: (data) => (data as { id?: string }).id ?? null,
          User: (data) => (data as { id?: string }).id ?? null,
        },
        updates: {
          Subscription: {
            medicinalProductUpdated(result, _args, cache) {
              const incoming = (result as { medicinalProductUpdated: unknown }).medicinalProductUpdated;
              if (!incoming) return;
              cache.writeFragment(
                gql`fragment MedicinalProductCacheUpdate on MedicinalProduct {
                  id productName stockLevel stockThreshold isBelowThreshold
                }`,
                incoming as Parameters<typeof cache.writeFragment>[1],
              );
            },
          },
        },
      }),
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
