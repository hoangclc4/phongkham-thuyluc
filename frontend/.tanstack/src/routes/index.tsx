import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth.store';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const { accessToken, user } = useAuthStore.getState();
    if (!accessToken || !user) throw redirect({ to: '/login' });
    if (user.role === 'admin') throw redirect({ to: '/admin' });
    throw redirect({ to: '/customer' });
  },
});
