const API = 'http://localhost:4000/api';

export function createApiClient(token: string) {
  async function post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = await res.json() as { data?: T; errors?: string[] };
    if (!res.ok) throw new Error(json.errors?.join(', ') ?? 'Request failed');
    return json.data as T;
  }

  return { post };
}
