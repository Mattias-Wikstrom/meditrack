const API = 'http://localhost:4000/api';

export function createApiClient(token: string) {
  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (res.status === 204) return undefined as T;
    const json = await res.json() as { data?: T; errors?: string[] };
    if (!res.ok) throw new Error(json.errors?.join(', ') ?? 'Request failed');
    return json.data as T;
  }

  return {
    post:  <T>(path: string, body?: unknown) => request<T>('POST',   path, body),
    patch: <T>(path: string, body?: unknown) => request<T>('PATCH',  path, body),
    del:       (path: string)                => request<void>('DELETE', path),
  };
}
