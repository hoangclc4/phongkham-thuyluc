import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth.store';
import { CustomerLayout } from '@/components/customer/CustomerLayout';

export const Route = createFileRoute('/customer/_layout')({
  beforeLoad: () => {
    const { accessToken, user } = useAuthStore.getState();
    if (!accessToken || user?.role !== 'customer') throw redirect({ to: '/customer/login' });
  },
  component: CustomerLayoutRoute,
});

function CustomerLayoutRoute() {
  return <CustomerLayout />;
}
