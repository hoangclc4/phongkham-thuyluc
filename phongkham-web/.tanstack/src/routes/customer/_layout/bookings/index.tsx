import { createFileRoute, Link } from '@tanstack/react-router';
import { useMyBookings } from '@/hooks/use-customer-portal';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS, SERVICE_TYPE_LABELS } from '@/types/booking';
import { formatDateTime } from '@/lib/formatDate';

export const Route = createFileRoute('/customer/_layout/bookings/')({
  component: CustomerBookingsPage,
});

function CustomerBookingsPage() {
  const { data: bookings, isLoading, isError } = useMyBookings();

  if (isError) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <p className="text-center text-red-600">Không thể tải danh sách lịch hẹn. Vui lòng thử lại.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Lịch hẹn</h1>
        <Link to="/customer/bookings/new">
          <Button size="sm" className="min-h-[44px]">+ Đặt lịch</Button>
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-5 w-48 mb-1" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))}
        </div>
      )}

      {!isLoading && bookings?.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-base text-gray-700 font-medium mb-3">Bạn chưa có lịch hẹn nào.</p>
          <Link to="/customer/bookings/new">
            <Button size="lg" className="min-h-[52px]">Đặt lịch khám ngay</Button>
          </Link>
        </Card>
      )}

      {!isLoading && bookings && bookings.length > 0 && (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Link key={booking.id} to="/customer/bookings/$id" params={{ id: booking.id }}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-gray-500">{booking.displayNumber}</p>
                      <p className="text-base font-semibold text-gray-900 mt-0.5">
                        {booking.pet.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {SERVICE_TYPE_LABELS[booking.serviceType]}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDateTime(booking.scheduledAt)}
                      </p>
                    </div>
                    <Badge
                      style={{ backgroundColor: BOOKING_STATUS_COLORS[booking.status] }}
                      className="text-white shrink-0"
                    >
                      {BOOKING_STATUS_LABELS[booking.status]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
