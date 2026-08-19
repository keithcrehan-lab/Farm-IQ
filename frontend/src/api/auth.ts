import { apiClient } from './client';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
}

export interface AuthResult {
  accessToken: string;
  user: AuthUser;
}

export function login(email: string, password: string) {
  return apiClient.post<AuthResult>('/auth/login', { email, password }).then((r) => r.data);
}

export function register(email: string, password: string, fullName?: string) {
  return apiClient
    .post<AuthResult>('/auth/register', { email, password, fullName })
    .then((r) => r.data);
}

export function getMe() {
  return apiClient.get<AuthUser>('/auth/me').then((r) => r.data);
}
