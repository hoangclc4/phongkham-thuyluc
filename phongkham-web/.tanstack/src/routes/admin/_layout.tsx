import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth.store';
import { AdminLayout } from '@/components/admin/AdminLayout';

export const Route = createFileRoute('/admin/_layout')({
  beforeLoad: () => {
    const { accessToken, user } = useAuthStore.getState();
    if (!accessToken || user?.role !== 'admin') throw redirect({ to: '/login' });
  },
  component: AdminLayoutRoute,
});

function AdminLayoutRoute() {
  return <AdminLayout />;
}
