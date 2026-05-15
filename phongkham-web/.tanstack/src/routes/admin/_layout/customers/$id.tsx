import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCustomer,
  useCustomerPets,
  useCustomerBookings,
  useUpdateCustomer,
  useSendInvite,
} from '@/hooks/use-customers';
import { toast } from '@/hooks/use-toast';
import { AllergyAlert } from '@/components/customers/AllergyAlert';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatVND } from '@/lib/formatVND';
import { formatDate, formatDateTime } from '@/lib/formatDate';
import type { Customer } from '@/types/customer';
import type { Pet } from '@/types/pet';
import type { Booking } from '@/types/booking';
import { PET_SPECIES_LABELS, PET_STATUS_LABELS } from '@/types/pet';
import { BOOKING_STATUS_LABELS } from '@/types/booking';

const updateInfoSchema = z.object({
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  address: z.string().optional(),
});

const updateNotesSchema = z.object({
  internalNotes: z.string().optional(),
});

type UpdateInfoValues = z.infer<typeof updateInfoSchema>;
type UpdateNotesValues = z.infer<typeof updateNotesSchema>;

export const Route = createFileRoute('/admin/_layout/customers/$id')({
  component: CustomerDetailPage,
});

function CustomerDetailPage() {
  const { id } = Route.useParams();
  const { data: customer, isLoading, isError } = useCustomer(id);
  const { data: pets } = useCustomerPets(id);

  if (isLoading) return <CustomerDetailSkeleton />;

  if (isError || !customer) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Không thể tải thông tin khách hàng.</AlertDescription>
      </Alert>
    );
  }

  const petsWithAllergies = (pets ?? []).filter((p) => p.knownAllergies.length > 0);

  return (
    <div className="space-y-6 max-w-4xl">
      {petsWithAllergies.map((pet) => (
        <AllergyAlert key={pet.id} petName={pet.name} allergies={pet.knownAllergies} />
      ))}

      <CustomerHeader customer={customer} />

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Thông tin</TabsTrigger>
          <TabsTrigger value="pets">Thú cưng</TabsTrigger>
          <TabsTrigger value="bookings">Lịch sử khám</TabsTrigger>
          <TabsTrigger value="finance">Tài chính</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <CustomerInfoTab customer={customer} />
        </TabsContent>

        <TabsContent value="pets">
          <CustomerPetsTab customerId={id} />
        </TabsContent>

        <TabsContent value="bookings">
          <CustomerBookingsTab customerId={id} />
        </TabsContent>

        <TabsContent value="finance">
          <CustomerFinanceTab customer={customer} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CustomerHeader({ customer }: { customer: Customer }) {
  const sendInvite = useSendInvite();

  function handleSendInvite() {
    sendInvite.mutate(customer.id, {
      onSuccess: () => toast({ title: 'Đã gửi lời mời thành công' }),
      onError: () =>
        toast({ title: 'Gửi lời mời thất bại', variant: 'destructive' }),
    });
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <Avatar name={customer.fullName} size="lg" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{customer.fullName}</h1>
          {customer.isActive ? (
            <Badge className="bg-green-100 text-green-700">Hoạt động</Badge>
          ) : (
            <Badge variant="secondary">Ngừng hoạt động</Badge>
          )}
        </div>
        <a
          href={`tel:${customer.phone}`}
          className="text-gray-500 hover:text-[var(--color-primary)] text-sm"
        >
          {customer.phone}
        </a>
      </div>
      <Button
        variant="outline"
        onClick={handleSendInvite}
        disabled={sendInvite.isPending || customer.hasAccount}
      >
        {customer.hasAccount ? 'Đã có tài khoản' : 'Gửi lời mời'}
      </Button>
    </div>
  );
}

function CustomerInfoTab({ customer }: { customer: Customer }) {
  const updateCustomer = useUpdateCustomer();
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const infoForm = useForm<UpdateInfoValues>({
    resolver: zodResolver(updateInfoSchema),
    defaultValues: {
      fullName: customer.fullName,
      email: customer.email ?? '',
      address: customer.address ?? '',
    },
  });

  const notesForm = useForm<UpdateNotesValues>({
    defaultValues: { internalNotes: customer.internalNotes ?? '' },
  });

  function handleSaveInfo(values: UpdateInfoValues) {
    updateCustomer.mutate(
      {
        id: customer.id,
        dto: {
          fullName: values.fullName,
          email: values.email || undefined,
          address: values.address || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: 'Cập nhật thành công' });
          setIsEditingInfo(false);
        },
        onError: () =>
          toast({ title: 'Cập nhật thất bại', variant: 'destructive' }),
      },
    );
  }

  function handleSaveNotes(values: UpdateNotesValues) {
    updateCustomer.mutate(
      {
        id: customer.id,
        dto: { internalNotes: values.internalNotes },
      },
      {
        onSuccess: () => {
          toast({ title: 'Đã lưu ghi chú' });
          setIsEditingNotes(false);
        },
        onError: () =>
          toast({ title: 'Lưu thất bại', variant: 'destructive' }),
      },
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Thông tin liên hệ</CardTitle>
            {!isEditingInfo && (
              <Button variant="outline" size="sm" onClick={() => setIsEditingInfo(true)}>
                Chỉnh sửa
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingInfo ? (
            <form onSubmit={infoForm.handleSubmit(handleSaveInfo)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-fullName">Họ tên</Label>
                <Input id="edit-fullName" {...infoForm.register('fullName')} />
                {infoForm.formState.errors.fullName && (
                  <p className="text-xs text-red-600">
                    {infoForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" {...infoForm.register('email')} />
                {infoForm.formState.errors.email && (
                  <p className="text-xs text-red-600">
                    {infoForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-address">Địa chỉ</Label>
                <Input id="edit-address" {...infoForm.register('address')} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={updateCustomer.isPending}>
                  Lưu
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingInfo(false)}
                >
                  Huỷ
                </Button>
              </div>
            </form>
          ) : (
            <dl className="space-y-3 text-sm">
              <InfoRow label="Họ tên" value={customer.fullName} />
              <InfoRow label="Email" value={customer.email ?? '—'} />
              <InfoRow label="Địa chỉ" value={customer.address ?? '—'} />
              <InfoRow label="SĐT" value={customer.phone} />
              <InfoRow label="Ngày tạo" value={formatDate(customer.createdAt)} />
              <InfoRow
                label="Đăng nhập lần cuối"
                value={customer.lastLoginAt ? formatDateTime(customer.lastLoginAt) : 'Chưa đăng nhập'}
              />
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Ghi chú nội bộ</CardTitle>
            {!isEditingNotes && (
              <Button variant="outline" size="sm" onClick={() => setIsEditingNotes(true)}>
                Chỉnh sửa
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingNotes ? (
            <form onSubmit={notesForm.handleSubmit(handleSaveNotes)} className="space-y-3">
              <Textarea
                {...notesForm.register('internalNotes')}
                placeholder="Ghi chú dành cho nhân viên..."
                className="min-h-[120px]"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={updateCustomer.isPending}>
                  Lưu
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingNotes(false)}
                >
                  Huỷ
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {customer.internalNotes ?? <span className="text-gray-400">Chưa có ghi chú.</span>}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-36 text-gray-500 shrink-0">{label}</dt>
      <dd className="text-gray-900">{value}</dd>
    </div>
  );
}

function CustomerPetsTab({ customerId }: { customerId: string }) {
  const { data: pets, isLoading, isError } = useCustomerPets(customerId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Không thể tải danh sách thú cưng.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link to="/admin/pets/new" search={{ customerId }}>
          <Button variant="outline" size="sm">
            + Thêm thú cưng
          </Button>
        </Link>
      </div>

      {pets?.length === 0 && (
        <p className="text-center text-gray-500 py-10">Chưa có thú cưng nào.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pets?.map((pet) => <PetCard key={pet.id} pet={pet} />)}
      </div>
    </div>
  );
}

function PetCard({ pet }: { pet: Pet }) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900">{pet.name}</span>
          <Badge variant="secondary">{PET_SPECIES_LABELS[pet.species]}</Badge>
          <Badge
            className={
              pet.status === 'healthy'
                ? 'bg-green-100 text-green-700'
                : pet.status === 'deceased'
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-amber-100 text-amber-700'
            }
          >
            {PET_STATUS_LABELS[pet.status]}
          </Badge>
        </div>
        <div className="text-sm text-gray-500 space-y-0.5">
          {pet.breed && <p>Giống: {pet.breed}</p>}
          {pet.ageDisplay && <p>Tuổi: {pet.ageDisplay}</p>}
        </div>
        <Link to="/admin/pets/$id" params={{ id: pet.id }}>
          <Button variant="outline" size="sm" className="w-full">
            Xem chi tiết
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function CustomerBookingsTab({ customerId }: { customerId: string }) {
  const { data: bookings, isLoading, isError } = useCustomerBookings(customerId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Không thể tải lịch sử khám.</AlertDescription>
      </Alert>
    );
  }

  if (!bookings?.length) {
    return <p className="text-center text-gray-500 py-10">Chưa có lịch sử khám.</p>;
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => <BookingTimelineItem key={booking.id} booking={booking} />)}
    </div>
  );
}

function BookingTimelineItem({ booking }: { booking: Booking }) {
  return (
    <div className="flex gap-4 items-start p-4 bg-white rounded-xl border border-gray-200">
      <div className="w-1 self-stretch bg-gray-200 rounded-full shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-gray-900">{booking.displayNumber}</span>
          <span className="text-gray-500 text-sm">{booking.serviceLabel}</span>
          <span className="text-gray-400 text-sm">—</span>
          <span className="text-sm text-gray-500">{booking.pet.name}</span>
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-xs text-gray-400">{formatDateTime(booking.scheduledAt)}</span>
          <Badge variant={booking.status as Parameters<typeof Badge>[0]['variant']}>
            {BOOKING_STATUS_LABELS[booking.status]}
          </Badge>
        </div>
      </div>
      <Link to="/admin/bookings/$id" params={{ id: booking.id }}>
        <Button variant="ghost" size="sm">
          Xem
        </Button>
      </Link>
    </div>
  );
}

function CustomerFinanceTab({ customer }: { customer: Customer }) {
  const avgPerVisit =
    customer.stats.totalVisits > 0
      ? Math.round(customer.stats.totalSpent / customer.stats.totalVisits)
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard label="Tổng lượt khám" value={String(customer.stats.totalVisits)} />
      <StatCard label="Tổng chi tiêu" value={formatVND(customer.stats.totalSpent)} />
      <StatCard label="Trung bình mỗi lần" value={formatVND(avgPerVisit)} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function CustomerDetailSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
