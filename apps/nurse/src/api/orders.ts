import { useMemo } from 'react';
import { useAuth, createApiClient } from '@meditrack/client';

export interface OrderLine { medicationId: string; quantity: number }

export function useOrdersApi() {
  const { token } = useAuth();
  return useMemo(() => {
    const { post } = createApiClient(token!);
    return {
      create: (wardUnitId: string, lines: OrderLine[]) =>
        post('/orders', { wardUnitId, lines }) as Promise<{ id: string }>,
      updateLines: (orderId: string, lines: OrderLine[]) =>
        post(`/orders/${orderId}/lines`, { lines }),
      send: (orderId: string) =>
        post(`/orders/${orderId}/send`),
    };
  }, [token]);
}
