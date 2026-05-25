import { createApiClient } from '@meditrack/client';

const { post } = createApiClient('nurse-anna');

export interface OrderLine { medicationId: string; quantity: number }

export const ordersApi = {
  create: (wardUnitId: string, lines: OrderLine[]) =>
    post('/orders', { wardUnitId, lines }),

  send: (orderId: string) =>
    post(`/orders/${orderId}/send`),
};
