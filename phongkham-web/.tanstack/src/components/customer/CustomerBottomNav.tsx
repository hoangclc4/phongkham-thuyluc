import { Link, useRouterState } from '@tanstack/react-router';
import { Home, Heart, Calendar, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/cn';

interface NavTab {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_TABS: NavTab[] = [
  { to: '/customer', label: 'Trang chủ', icon: <Home className="h-5 w-5" /> },
  { to: '/customer/pets', label: 'Thú cưng', icon: <Heart className="h-5 w-5" /> },
  { to: '/customer/bookings', label: 'Lịch hẹn', icon: <Calendar className="h-5 w-5" /> },
  { to: '/customer/chat', label: 'Trợ lý AI', icon: <MessageCircle className="h-5 w-5" /> },
  { to: '/customer/profile', label: 'Hồ sơ', icon: <User className="h-5 w-5" /> },
];

export function CustomerBottomNav() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  function isActive(to: string): boolean {
    if (to === '/customer') return currentPath === '/customer' || currentPath === '/customer/';
    return currentPath.startsWith(to);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 pb-safe">
      <div className="flex items-center">
        {NAV_TABS.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors',
              isActive(tab.to)
                ? 'text-[var(--color-primary)]'
                : 'text-gray-400 hover:text-gray-600',
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
