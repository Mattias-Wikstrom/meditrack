const API = 'http://localhost:4000/api';
const ACTOR_ID = 'nurse-anna';

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Actor-Id': ACTOR_ID },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json() as { data?: T; errors?: string[] };
  if (!res.ok) throw new Error(json.errors?.join(', ') ?? 'Request failed');
  return json.data as T;
}

export interface OrderLine { medicationId: string; quantity: number }

export const ordersApi = {
  create: (wardUnitId: string, lines: OrderLine[]) =>
    post('/orders', { wardUnitId, lines }),

  send: (orderId: string) =>
    post(`/orders/${orderId}/send`),
};
