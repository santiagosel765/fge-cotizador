const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

function buildUrl(path: string): string {
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const response = await fetch(buildUrl(path), {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    let message = `Error ${response.status}`;
    try {
      const errorBody = await response.json() as { message?: string | string[] };
      if (Array.isArray(errorBody.message)) {
        message = errorBody.message.join(', ');
      } else if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      // Ignorar errores de parseo
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  delete: <T = void>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
