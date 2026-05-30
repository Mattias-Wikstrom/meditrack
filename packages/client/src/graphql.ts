import { createClient, fetchExchange, mapExchange, subscriptionExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache';
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
          Actor: (data) => (data as { id?: string }).id ?? null,
          AuditEvent: () => null,
          OrderLine: () => null,
        },
        updates: {
          Subscription: {
            repositoryChanged(result, _args, cache) {
              const event = (result as { repositoryChanged?: { entityType: string; kind: string; entityId: string } | null }).repositoryChanged;
              if (!event) return;

              const { entityType, entityId } = event;
              cache.invalidate({ __typename: entityType, id: entityId });

              const listField: Record<string, string> = {
                WardUnit: 'wardUnits',
                Actor: 'actors',
                Order: 'orders',
                Medication: 'medications',
                MedicinalProduct: 'medicinalProducts',
              };
              if (listField[entityType]) cache.invalidate('Query', listField[entityType]);
              cache.invalidate('Query', 'auditLog');
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
