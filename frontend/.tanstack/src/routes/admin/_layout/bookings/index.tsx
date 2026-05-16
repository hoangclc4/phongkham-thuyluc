import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DatesSetArg } from '@fullcalendar/core';
import { useBookings, useUpdateBookingStatus } from '@/hooks/use-bookings';
import { useToast } from '@/hooks/use-toast';
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
  SERVICE_TYPE_LABELS,
} from '@/types/booking';
import type { Booking, BookingStatus, BookingListParams, ServiceType } from '@/types/booking';
import { formatDateTime } from '@/lib/formatDate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';

export const Route = createFileRoute('/admin/_layout/bookings/')({
  component: BookingsPage,
});

type ViewMode = 'calendar' | 'list';

const ALL_STATUS_VALUE = 'all';
const PAGE_SIZE = 20;

interface StatusTransition {
  label: string;
  nextStatus: BookingStatus;
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
}

const STATUS_TRANSITIONS: Partial<Record<BookingStatus, StatusTransition[]>> = {
  pending: [
    { label: 'Xác nhận', nextStatus: 'confirmed', variant: 'default' },
    { label: 'Từ chối', nextStatus: 'cancelled', variant: 'destructive' },
  ],
  confirmed: [
    { label: 'Check-in', nextStatus: 'checked_in', variant: 'default' },
    { label: 'Huỷ', nextStatus: 'cancelled', variant: 'destructive' },
    { label: 'Không đến', nextStatus: 'no_show', variant: 'outline' },
  ],
  checked_in: [
    { label: 'Bắt đầu khám', nextStatus: 'in_progress', variant: 'default' },
  ],
  in_progress: [
    { label: 'Hoàn thành', nextStatus: 'completed', variant: 'default' },
  ],
};

function QuickActionDialog({
  booking,
  onClose,
}: {
  booking: Booking;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const updateStatus = useUpdateBookingStatus();
  const { toast } = useToast();

  const transitions = STATUS_TRANSITIONS[booking.status] ?? [];

  function handleStatusChange(nextStatus: BookingStatus) {
    updateStatus.mutate(
      { id: booking.id, dto: { status: nextStatus } },
      {
        onSuccess: () => {
          toast({ title: 'Đã cập nhật trạng thái' });
          onClose();
        },
        onError: () => {
          toast({ title: 'Lỗi khi cập nhật', variant: 'destructive' });
        },
      },
    );
  }

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Chi tiết lịch hẹn</DialogTitle>
      </DialogHeader>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Mã lịch hẹn</span>
          <span className="font-mono font-medium">{booking.displayNumber}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Khách hàng</span>
          <span>{booking.customer.displayName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Thú cưng</span>
          <span>{booking.pet.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Dịch vụ</span>
          <span>{booking.serviceLabel}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Thời gian</span>
          <span>{formatDateTime(booking.scheduledAt)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Trạng thái</span>
          <BookingStatusBadge status={booking.status} />
        </div>
      </div>

      <DialogFooter className="flex-wrap gap-2">
        {transitions.map((t) => (
          <Button
            key={t.nextStatus}
            variant={t.variant}
            size="sm"
            disabled={updateStatus.isPending}
            onClick={() => handleStatusChange(t.nextStatus)}
          >
            {t.label}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ to: '/admin/bookings/$id', params: { id: booking.id } })}
        >
          Xem chi tiết
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function CalendarView() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [calendarRange, setCalendarRange] = useState<{ dateFrom: string; dateTo: string }>({
    dateFrom: '',
    dateTo: '',
  });

  const { data } = useBookings(
    { dateFrom: calendarRange.dateFrom, dateTo: calendarRange.dateTo, limit: 200 },
    Boolean(calendarRange.dateFrom),
  );

  const bookings = data?.data ?? [];

  const calendarEvents = bookings.map((b) => ({
    id: b.id,
    title: `${b.pet.name} — ${b.serviceLabel}`,
    start: b.scheduledAt,
    backgroundColor: BOOKING_STATUS_COLORS[b.status],
    borderColor: BOOKING_STATUS_COLORS[b.status],
    extendedProps: { booking: b },
  }));

  function handleEventClick(arg: EventClickArg) {
    const booking = arg.event.extendedProps.booking as Booking;
    setSelectedBooking(booking);
  }

  function handleDatesSet(arg: DatesSetArg) {
    setCalendarRange({
      dateFrom: arg.startStr.slice(0, 10),
      dateTo: arg.endStr.slice(0, 10),
    });
  }

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale="vi"
          slotMinTime="07:00:00"
          slotMaxTime="20:00:00"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          buttonText={{
            today: 'Hôm nay',
            month: 'Tháng',
            week: 'Tuần',
            day: 'Ngày',
          }}
          events={calendarEvents}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          height="auto"
        />
      </div>

      <Dialog open={selectedBooking !== null} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        {selectedBooking && (
          <QuickActionDialog booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
        )}
      </Dialog>
    </>
  );
}

function ListViewFilters({
  params,
  onChange,
}: {
  params: BookingListParams;
  onChange: (p: BookingListParams) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <Input
        type="date"
        className="w-40"
        value={params.dateFrom ?? ''}
        onChange={(e) => onChange({ ...params, dateFrom: e.target.value || undefined, page: 1 })}
        aria-label="Từ ngày"
      />
      <Input
        type="date"
        className="w-40"
        value={params.dateTo ?? ''}
        onChange={(e) => onChange({ ...params, dateTo: e.target.value || undefined, page: 1 })}
        aria-label="Đến ngày"
      />
      <Select
        value={params.status ?? ALL_STATUS_VALUE}
        onValueChange={(v) =>
          onChange({ ...params, status: v === ALL_STATUS_VALUE ? undefined : (v as BookingStatus), page: 1 })
        }
      >
        <SelectTrigger className="w-44" aria-label="Trạng thái">
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_STATUS_VALUE}>Tất cả</SelectItem>
          {(Object.entries(BOOKING_STATUS_LABELS) as [BookingStatus, string][]).map(([status, label]) => (
            <SelectItem key={status} value={status}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={params.serviceType ?? ALL_STATUS_VALUE}
        onValueChange={(v) =>
          onChange({ ...params, serviceType: v === ALL_STATUS_VALUE ? undefined : (v as ServiceType), page: 1 })
        }
      >
        <SelectTrigger className="w-44" aria-label="Dịch vụ">
          <SelectValue placeholder="Dịch vụ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_STATUS_VALUE}>Tất cả dịch vụ</SelectItem>
          {(Object.entries(SERVICE_TYPE_LABELS) as [ServiceType, string][]).map(([type, label]) => (
            <SelectItem key={type} value={type}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="search"
        placeholder="Tìm kiếm..."
        className="w-52"
        value={params.search ?? ''}
        onChange={(e) => onChange({ ...params, search: e.target.value || undefined, page: 1 })}
        aria-label="Tìm kiếm"
      />
    </div>
  );
}

function ListView() {
  const navigate = useNavigate();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [params, setParams] = useState<BookingListParams>({ page: 1, limit: PAGE_SIZE });

  const { data, isLoading } = useBookings(params);
  const bookings = data?.data ?? [];
  const total = data?.total ?? 0;
  const currentPage = params.page ?? 1;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <ListViewFilters params={params} onChange={setParams} />

        {bookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-500">
            Không có lịch hẹn nào.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Thú cưng</TableHead>
                  <TableHead>Dịch vụ</TableHead>
                  <TableHead>Ngày giờ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs">{booking.displayNumber}</TableCell>
                    <TableCell>
                      <div>{booking.customer.displayName}</div>
                      <div className="text-xs text-gray-500">{booking.customer.phone}</div>
                    </TableCell>
                    <TableCell>{booking.pet.name}</TableCell>
                    <TableCell>{booking.serviceLabel}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDateTime(booking.scheduledAt)}</TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          Thao tác
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate({ to: '/admin/bookings/$id', params: { id: booking.id } })
                          }
                        >
                          Xem
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, total)} / {total} kết quả
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={selectedBooking !== null} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        {selectedBooking && (
          <QuickActionDialog booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
        )}
      </Dialog>
    </>
  );
}

function BookingsPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Lịch hẹn</h1>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setViewMode('calendar')}
            >
              Lịch
            </button>
            <button
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setViewMode('list')}
            >
              Danh sách
            </button>
          </div>

          <Button onClick={() => navigate({ to: '/admin/bookings/new' })}>
            Tạo lịch hẹn
          </Button>
        </div>
      </div>

      {viewMode === 'calendar' ? <CalendarView /> : <ListView />}
    </div>
  );
}
