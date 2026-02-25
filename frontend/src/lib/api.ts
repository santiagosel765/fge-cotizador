const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      let message = `Error ${res.status}`;
      try {
        const err = await res.json() as { message?: string };
        message = err.message ?? message;
      } catch {
        // ignorar body inválido
      }
      throw new Error(message);
    }
    return res.json() as Promise<T>;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Error de red');
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string) =>
    request<void>(path, { method: 'DELETE' }),
};
