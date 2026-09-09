import { AuthStorage } from '@acepharm/preferences';
import { apiClient } from './api-client';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  role: string;
  status: string;
  emailVerifiedAt: string | null;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

function persistTokens(accessToken: string, refreshToken: string): void {
  AuthStorage.setToken(accessToken);
  AuthStorage.setRefreshToken(refreshToken);
}

export function clearSession(): void {
  AuthStorage.removeToken();
  AuthStorage.removeRefreshToken();
  AuthStorage.removeSavedProfile();
}

/** Synchronous read of the cached access token — the api-client transparently refreshes it on 401. */
export function getAccessToken(): string {
  return AuthStorage.getToken();
}

export async function apiSignUp(email: string, password: string, firstName?: string): Promise<AuthTokenResponse> {
  const res = await apiClient.post<AuthTokenResponse>('/api/v1/auth/signup', { email, password, firstName });
  persistTokens(res.accessToken, res.refreshToken);
  return res;
}

export async function apiSignIn(email: string, password: string): Promise<AuthTokenResponse> {
  const res = await apiClient.post<AuthTokenResponse>('/api/v1/auth/login', { email, password });
  persistTokens(res.accessToken, res.refreshToken);
  return res;
}

export async function apiLogout(): Promise<void> {
  const refreshToken = AuthStorage.getRefreshToken();
  clearSession();
  if (refreshToken) {
    try {
      await apiClient.post('/api/v1/auth/logout', { refreshToken });
    } catch {
      // best-effort — local session is already cleared
    }
  }
}

export async function apiRequestPasswordReset(email: string): Promise<void> {
  await apiClient.post('/api/v1/auth/request-password-reset', { email });
}

export async function apiResetPassword(token: string, newPassword: string): Promise<void> {
  await apiClient.post('/api/v1/auth/reset-password', { token, newPassword });
}

export async function apiVerifyEmail(token: string): Promise<void> {
  await apiClient.post('/api/v1/auth/verify-email', { token });
}

export async function apiResendVerification(): Promise<void> {
  await apiClient.post('/api/v1/auth/resend-verification');
}

export async function apiChangePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.post('/api/v1/auth/change-password', { currentPassword, newPassword });
}
