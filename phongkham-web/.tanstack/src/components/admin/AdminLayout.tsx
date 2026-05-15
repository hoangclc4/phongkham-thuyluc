import { Outlet } from '@tanstack/react-router';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Toaster } from '@/components/ui/toaster';

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="ml-[250px] min-h-screen p-6">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
