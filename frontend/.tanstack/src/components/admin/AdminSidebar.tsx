import { Link, useRouterState } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Heart,
  FileText,
  Receipt,
  BarChart2,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/use-auth';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { to: '/admin/bookings', label: 'Lịch hẹn', icon: <Calendar className="h-5 w-5" /> },
  { to: '/admin/customers', label: 'Khách hàng', icon: <Users className="h-5 w-5" /> },
  { to: '/admin/pets', label: 'Thú cưng', icon: <Heart className="h-5 w-5" /> },
  { to: '/admin/medical-records', label: 'Hồ sơ bệnh lý', icon: <FileText className="h-5 w-5" /> },
  { to: '/admin/invoices', label: 'Hoá đơn', icon: <Receipt className="h-5 w-5" /> },
  { to: '/admin/reports', label: 'Báo cáo', icon: <BarChart2 className="h-5 w-5" /> },
];

export function AdminSidebar() {
  const routerState = useRouterState();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const currentPath = routerState.location.pathname;

  function isActive(to: string): boolean {
    if (to === '/admin') return currentPath === '/admin' || currentPath === '/admin/';
    return currentPath.startsWith(to);
  }

  const userEmail = user?.role === 'admin' ? user.email : '';

  return (
    <aside className="fixed left-0 top-0 h-full w-[250px] flex flex-col bg-[var(--color-sidebar)] z-40">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="text-xl mb-0.5">🐾</div>
        <p className="text-white text-xs leading-tight opacity-80">Phòng Khám Thú Y Bác Sĩ Lục</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              isActive(item.to)
                ? 'text-white bg-white/20 border-l-2 border-[var(--color-accent)]'
                : 'text-white/60 hover:text-white hover:bg-white/10',
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-white/50 text-xs truncate mb-3">{userEmail}</p>
        <button
          onClick={() => logout.mutate()}
          className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
