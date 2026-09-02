import { AuthStorage } from '@acepharm/preferences';
import { auth } from './firebase';

export interface ApiClientOptions extends RequestInit {
  token?: string | null;
  params?: Record<string, string | number | boolean | undefined | null>;
}

export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.acepharmexams.co.uk';

/**
 * Resolves the active user token:
 * 1. Checks manually provided token in options
 * 2. Checks cached token in AuthStorage
 * 3. Falls back to active Firebase current user getIdToken()
 */
async function resolveAuthToken(explicitToken?: string | null): Promise<string | null> {
  if (explicitToken !== undefined) {
    return explicitToken;
  }

  const cachedToken = AuthStorage.getToken();
  if (cachedToken) {
    return cachedToken;
  }

  if (typeof window !== 'undefined' && auth.currentUser) {
    try {
      const freshToken = await auth.currentUser.getIdToken();
      if (freshToken) {
        AuthStorage.setToken(freshToken);
        return freshToken;
      }
    } catch {
      // Ignored if unauthenticated
    }
  }

  return null;
}

/**
 * Core request dispatcher
 */
async function request<T = any>(
  path: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { token, params, headers = {}, ...restOptions } = options;

  const baseUrl = DEFAULT_API_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${baseUrl}${cleanPath}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const resolvedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  const authToken = await resolveAuthToken(token);
  if (authToken) {
    resolvedHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url.toString(), {
    ...restOptions,
    headers: resolvedHeaders,
  });

  let data: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMessage =
      data?.error ||
      data?.message ||
      (typeof data === 'string' ? data : `HTTP ${response.status}: ${response.statusText}`);
    throw new ApiError(response.status, errorMessage, data);
  }

  return data as T;
}

export const apiClient = {
  get: <T = any>(path: string, options?: ApiClientOptions) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T = any>(path: string, body?: any, options?: ApiClientOptions) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    }),

  put: <T = any>(path: string, body?: any, options?: ApiClientOptions) =>
    request<T>(path, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    }),

  patch: <T = any>(path: string, body?: any, options?: ApiClientOptions) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    }),

  delete: <T = any>(path: string, options?: ApiClientOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),

  baseUrl: DEFAULT_API_URL,
};
