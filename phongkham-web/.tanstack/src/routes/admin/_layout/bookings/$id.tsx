import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useBooking, useUpdateBookingStatus } from '@/hooks/use-bookings';
import { useToast } from '@/hooks/use-toast';
import type { BookingStatus } from '@/types/booking';
import { formatDate, formatDateTime } from '@/lib/formatDate';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';

export const Route = createFileRoute('/admin/_layout/bookings/$id')({
  component: BookingDetailPage,
});

interface StatusTransition {
  label: string;
  nextStatus: BookingStatus;
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
  requiresConfirm: boolean;
}

const STATUS_TRANSITIONS: Partial<Record<BookingStatus, StatusTransition[]>> = {
  pending: [
    { label: 'Xác nhận lịch', nextStatus: 'confirmed', variant: 'default', requiresConfirm: false },
    { label: 'Từ chối', nextStatus: 'cancelled', variant: 'destructive', requiresConfirm: true },
  ],
  confirmed: [
    { label: 'Check-in', nextStatus: 'checked_in', variant: 'default', requiresConfirm: false },
    { label: 'Huỷ lịch', nextStatus: 'cancelled', variant: 'destructive', requiresConfirm: true },
    { label: 'Không đến', nextStatus: 'no_show', variant: 'outline', requiresConfirm: true },
  ],
  checked_in: [
    { label: 'Bắt đầu khám', nextStatus: 'in_progress', variant: 'default', requiresConfirm: false },
  ],
  in_progress: [
    { label: 'Hoàn thành', nextStatus: 'completed', variant: 'default', requiresConfirm: false },
  ],
};

function ConfirmDialog({
  label,
  onConfirm,
  onClose,
}: {
  label: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Xác nhận thao tác</DialogTitle>
      </DialogHeader>
      <p className="text-sm text-gray-600">
        Bạn có chắc muốn <strong>{label.toLowerCase()}</strong> lịch hẹn này không? Hành động này không thể hoàn tác.
      </p>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Hủy bỏ
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          Xác nhận
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function BookingDetailPage() {
  const { id } = Route.useParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: booking, isLoading, isError } = useBooking(id);
  const updateStatus = useUpdateBookingStatus();

  const [pendingTransition, setPendingTransition] = useState<StatusTransition | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Không tìm thấy lịch hẹn. Có thể đã bị xoá hoặc không tồn tại.</AlertDescription>
      </Alert>
    );
  }

  const transitions = STATUS_TRANSITIONS[booking.status] ?? [];

  function handleTransitionClick(transition: StatusTransition) {
    if (transition.requiresConfirm) {
      setPendingTransition(transition);
      return;
    }
    executeTransition(transition.nextStatus);
  }

  function executeTransition(nextStatus: BookingStatus) {
    updateStatus.mutate(
      { id: booking!.id, dto: { status: nextStatus } },
      {
        onSuccess: () => {
          toast({ title: 'Đã cập nhật trạng thái' });
          setPendingTransition(null);
        },
        onError: () => {
          toast({ title: 'Lỗi khi cập nhật', variant: 'destructive' });
          setPendingTransition(null);
        },
      },
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link to="/admin/bookings" className="hover:text-gray-900">
          Lịch hẹn
        </Link>
        <span>/</span>
        <span className="text-gray-900">{booking.displayNumber}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 font-mono">{booking.displayNumber}</h1>
          <BookingStatusBadge status={booking.status} />
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: '/admin/bookings' })}>
          Quay lại
        </Button>
      </div>

      {/* Status Actions */}
      {transitions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">Thao tác trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {transitions.map((t) => (
                <Button
                  key={t.nextStatus}
                  variant={t.variant}
                  size="sm"
                  disabled={updateStatus.isPending}
                  onClick={() => handleTransitionClick(t)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left: Customer + Pet */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">Thông tin khách hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Tên</span>
              <span className="font-medium">{booking.customer.displayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">SĐT</span>
              <span>{booking.customer.phone}</span>
            </div>
            <div className="pt-1">
              <Link
                to="/admin/customers/$id"
                params={{ id: booking.customer.id }}
                className="text-xs text-[var(--color-primary)] hover:underline"
              >
                Xem khách hàng →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">Thông tin thú cưng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Tên</span>
              <span className="font-medium">{booking.pet.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Loài</span>
              <span>{booking.pet.species}</span>
            </div>
            {booking.pet.breed && (
              <div className="flex justify-between">
                <span className="text-gray-500">Giống</span>
                <span>{booking.pet.breed}</span>
              </div>
            )}
            <div className="pt-1">
              <Link
                to="/admin/pets/$id"
                params={{ id: booking.pet.id }}
                className="text-xs text-[var(--color-primary)] hover:underline"
              >
                Xem thú cưng →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Right: Booking Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">Chi tiết lịch hẹn</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Dịch vụ</span>
              <span className="font-medium">{booking.serviceLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Thời gian</span>
              <span>{formatDateTime(booking.scheduledAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Thời lượng</span>
              <span>{booking.durationMinutes} phút</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Nguồn</span>
              <span>{booking.source}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ngày tạo</span>
              <span>{formatDate(booking.createdAt)}</span>
            </div>
            {booking.notes && (
              <div className="sm:col-span-2">
                <span className="text-gray-500">Ghi chú</span>
                <p className="mt-1 rounded-md bg-gray-50 p-2 text-gray-800">{booking.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={pendingTransition !== null} onOpenChange={(open) => !open && setPendingTransition(null)}>
        {pendingTransition && (
          <ConfirmDialog
            label={pendingTransition.label}
            onConfirm={() => executeTransition(pendingTransition.nextStatus)}
            onClose={() => setPendingTransition(null)}
          />
        )}
      </Dialog>
    </div>
  );
}
