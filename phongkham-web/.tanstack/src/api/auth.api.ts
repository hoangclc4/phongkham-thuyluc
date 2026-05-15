import { api } from '@/lib/api';
import type { LoginResponse } from '@/types/auth';

export async function adminLogin(email: string, password: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/admin/login', { email, password });
  return response.data;
}

export async function customerLogin(phone: string, password: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/customer/login', { phone, password });
  return response.data;
}

export async function refresh(): Promise<{ accessToken: string }> {
  const response = await api.post<{ accessToken: string }>('/auth/refresh');
  return response.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function forgotPassword(phone: string): Promise<void> {
  await api.post('/auth/forgot-password', { phone });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post('/auth/reset-password', { token, newPassword });
}
