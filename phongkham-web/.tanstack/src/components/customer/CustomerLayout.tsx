import { Outlet } from '@tanstack/react-router';
import { CustomerBottomNav } from '@/components/customer/CustomerBottomNav';
import { Toaster } from '@/components/ui/toaster';

export function CustomerLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
        <p className="text-center text-sm font-semibold text-[var(--color-primary)]">
          Phòng Khám Thú Y Bác Sĩ Lục
        </p>
      </header>
      <main className="pb-16">
        <Outlet />
      </main>
      <CustomerBottomNav />
      <Toaster />
    </div>
  );
}
