import { AuthStorage } from '@acepharm/preferences';

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

// Auth routes that must never trigger the refresh-and-retry path — retrying against
// /refresh itself would loop, and /login|/signup are unauthenticated by definition.
const NO_REFRESH_RETRY_PATHS = ['/api/v1/auth/refresh', '/api/v1/auth/login', '/api/v1/auth/signup', '/api/v1/auth/logout'];

function resolveAuthToken(explicitToken?: string | null): string | null {
  if (explicitToken !== undefined) {
    return explicitToken;
  }
  return AuthStorage.getToken() || null;
}

// Dedupes concurrent refresh attempts so a burst of 401s only refreshes once.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = AuthStorage.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const baseUrl = DEFAULT_API_URL.replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        AuthStorage.removeToken();
        AuthStorage.removeRefreshToken();
        AuthStorage.removeSavedProfile();
        return null;
      }

      const data = await res.json();
      AuthStorage.setToken(data.accessToken);
      AuthStorage.setRefreshToken(data.refreshToken);
      return data.accessToken as string;
    } catch {
      return null;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/**
 * Core request dispatcher
 */
async function request<T = any>(
  path: string,
  options: ApiClientOptions = {},
  _isRetry = false
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

  const authToken = resolveAuthToken(token);
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
    if (
      response.status === 401 &&
      !_isRetry &&
      authToken &&
      !NO_REFRESH_RETRY_PATHS.includes(cleanPath)
    ) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return request<T>(path, options, true);
      }
    }

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
