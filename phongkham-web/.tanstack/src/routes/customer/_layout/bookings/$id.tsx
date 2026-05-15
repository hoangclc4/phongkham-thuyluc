import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useMyBookings, useCancelMyBooking } from '@/hooks/use-customer-portal';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
  SERVICE_TYPE_LABELS,
} from '@/types/booking';
import { formatDateTime } from '@/lib/formatDate';
import { ChevronLeft } from 'lucide-react';

const CANCELLABLE_STATUSES = ['pending', 'confirmed'] as const;
type CancellableStatus = (typeof CANCELLABLE_STATUSES)[number];

function isCancellable(status: string): status is CancellableStatus {
  return (CANCELLABLE_STATUSES as readonly string[]).includes(status);
}

export const Route = createFileRoute('/customer/_layout/bookings/$id')({
  component: CustomerBookingDetailPage,
});

function CustomerBookingDetailPage() {
  const { id } = Route.useParams();
  const { toast } = useToast();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const { data: bookings, isLoading, isError } = useMyBookings();
  const cancelBooking = useCancelMyBooking();

  const booking = bookings?.find((b) => b.id === id);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <Alert variant="destructive">
          <AlertDescription>Không tìm thấy lịch hẹn này.</AlertDescription>
        </Alert>
      </div>
    );
  }

  async function handleCancel() {
    await cancelBooking.mutateAsync(id);
    toast({ title: 'Đã huỷ lịch hẹn' });
    setCancelDialogOpen(false);
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <Link
        to="/customer/bookings"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 -ml-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Lịch hẹn
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-mono text-gray-500">{booking.displayNumber}</p>
          <h1 className="text-xl font-bold text-gray-900 mt-0.5">Chi tiết lịch hẹn</h1>
        </div>
        <Badge
          style={{ backgroundColor: BOOKING_STATUS_COLORS[booking.status] }}
          className="text-white mt-1"
        >
          {BOOKING_STATUS_LABELS[booking.status]}
        </Badge>
      </div>

      <Card>
        <CardContent className="p-5 space-y-3">
          <InfoRow label="Thú cưng" value={booking.pet.name} />
          <InfoRow label="Dịch vụ" value={SERVICE_TYPE_LABELS[booking.serviceType]} />
          <InfoRow label="Thời gian" value={formatDateTime(booking.scheduledAt)} />
          <InfoRow label="Thời lượng" value={`${booking.durationMinutes} phút`} />
          {booking.notes && <InfoRow label="Ghi chú" value={booking.notes} />}
        </CardContent>
      </Card>

      {isCancellable(booking.status) && (
        <Button
          variant="outline"
          size="lg"
          className="w-full min-h-[52px] text-base text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => setCancelDialogOpen(true)}
        >
          Huỷ lịch hẹn
        </Button>
      )}

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận huỷ lịch</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mt-1">
            Bạn có chắc muốn huỷ lịch hẹn{' '}
            <span className="font-semibold">{booking.displayNumber}</span> không?
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              Không
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelBooking.isPending}
            >
              {cancelBooking.isPending ? (
                <>
                  <Spinner size="sm" /> Đang huỷ...
                </>
              ) : (
                'Xác nhận huỷ'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex gap-3">
      <span className="text-sm text-gray-500 w-24 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
