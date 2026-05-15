import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import * as authApi from '@/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.adminLogin(email, password),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
    },
  });
}

export function useCustomerLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: ({ phone, password }: { phone: string; password: string }) =>
      authApi.customerLogin(phone, password),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const router = useRouter();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearAuth();
      router.navigate({ to: '/login' });
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (phone: string) => authApi.forgotPassword(phone),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authApi.resetPassword(token, newPassword),
  });
}
