import { useState, useEffect } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCustomers, useCustomerPets } from '@/hooks/use-customers';
import { useBookingSlots, useCreateBooking } from '@/hooks/use-bookings';
import { useToast } from '@/hooks/use-toast';
import { SERVICE_TYPE_LABELS } from '@/types/booking';
import type { ServiceType } from '@/types/booking';
import type { Customer } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/admin/_layout/bookings/new')({
  component: NewBookingPage,
});

const bookingSchema = z.object({
  customerId: z.string().min(1, 'Vui lòng chọn khách hàng'),
  petId: z.string().min(1, 'Vui lòng chọn thú cưng'),
  serviceType: z.string().min(1, 'Vui lòng chọn dịch vụ'),
  scheduledDate: z.string().min(1, 'Vui lòng chọn ngày'),
  scheduledTime: z.string().min(1, 'Vui lòng chọn giờ'),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

function CustomerSearch({
  onSelect,
}: {
  onSelect: (customer: Customer) => void;
}) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useCustomers({
    search: debouncedSearch || undefined,
    limit: 10,
  });

  const customers = data?.data ?? [];

  function handleSelect(customer: Customer) {
    setSelectedName(customer.fullName);
    setSearch('');
    setIsOpen(false);
    onSelect(customer);
  }

  return (
    <div className="relative">
      <Input
        value={selectedName || search}
        placeholder="Tìm theo tên hoặc SĐT..."
        onChange={(e) => {
          setSearch(e.target.value);
          setSelectedName('');
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
      />
      {isOpen && (search.length > 0 || customers.length > 0) && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
              <Spinner size="sm" />
              Đang tìm...
            </div>
          )}
          {!isLoading && customers.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-500">Không tìm thấy kết quả.</p>
          )}
          {customers.map((customer) => (
            <button
              key={customer.id}
              type="button"
              className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
              onClick={() => handleSelect(customer)}
            >
              <span className="font-medium">{customer.fullName}</span>
              <span className="text-gray-500">{customer.phone}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NewBookingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createBooking = useCreateBooking();

  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerId: '',
      petId: '',
      serviceType: '',
      scheduledDate: '',
      scheduledTime: '',
      notes: '',
    },
  });

  const watchedDate = watch('scheduledDate');
  const watchedCustomerId = watch('customerId');

  const { data: petsData, isLoading: petsLoading } = useCustomerPets(selectedCustomerId);
  const pets = petsData ?? [];

  const { data: slotsData, isLoading: slotsLoading } = useBookingSlots(
    watchedDate,
    watchedCustomerId || undefined,
  );
  const slots = slotsData ?? [];

  function handleCustomerSelect(customer: Customer) {
    setSelectedCustomerId(customer.id);
    setValue('customerId', customer.id, { shouldValidate: true });
    setValue('petId', '', { shouldValidate: false });
  }

  function onSubmit(values: BookingFormValues) {
    const scheduledAt = new Date(`${values.scheduledDate}T${values.scheduledTime}:00`).toISOString();

    createBooking.mutate(
      {
        customerId: values.customerId,
        petId: values.petId,
        serviceType: values.serviceType as ServiceType,
        scheduledAt,
        notes: values.notes || undefined,
      },
      {
        onSuccess: () => {
          toast({ title: 'Đã tạo lịch hẹn thành công' });
          navigate({ to: '/admin/bookings' });
        },
        onError: () => {
          toast({ title: 'Lỗi khi tạo lịch hẹn', variant: 'destructive' });
        },
      },
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link to="/admin/bookings" className="hover:text-gray-900">
          Lịch hẹn
        </Link>
        <span>/</span>
        <span className="text-gray-900">Tạo mới</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">Tạo lịch hẹn mới</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin lịch hẹn</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Customer */}
            <div className="space-y-1.5">
              <Label htmlFor="customer-search">Khách hàng *</Label>
              <CustomerSearch onSelect={handleCustomerSelect} />
              {errors.customerId && (
                <p role="alert" className="text-xs text-red-600">
                  {errors.customerId.message}
                </p>
              )}
            </div>

            {/* Pet */}
            <div className="space-y-1.5">
              <Label htmlFor="petId">Thú cưng *</Label>
              <Controller
                name="petId"
                control={control}
                render={({ field }) => (
                  <Select
                    disabled={!selectedCustomerId}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="petId"
                      aria-invalid={!!errors.petId}
                      aria-describedby={errors.petId ? 'petId-error' : undefined}
                    >
                      <SelectValue placeholder={petsLoading ? 'Đang tải...' : 'Chọn thú cưng'} />
                    </SelectTrigger>
                    <SelectContent>
                      {pets.map((pet) => (
                        <SelectItem key={pet.id} value={pet.id}>
                          {pet.name} ({pet.speciesLabel})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.petId && (
                <p id="petId-error" role="alert" className="text-xs text-red-600">
                  {errors.petId.message}
                </p>
              )}
            </div>

            {/* Service Type */}
            <div className="space-y-1.5">
              <Label htmlFor="serviceType">Dịch vụ *</Label>
              <Controller
                name="serviceType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="serviceType"
                      aria-invalid={!!errors.serviceType}
                      aria-describedby={errors.serviceType ? 'serviceType-error' : undefined}
                    >
                      <SelectValue placeholder="Chọn dịch vụ" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(SERVICE_TYPE_LABELS) as [ServiceType, string][]).map(
                        ([type, label]) => (
                          <SelectItem key={type} value={type}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.serviceType && (
                <p id="serviceType-error" role="alert" className="text-xs text-red-600">
                  {errors.serviceType.message}
                </p>
              )}
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <Label htmlFor="scheduledDate">Ngày khám *</Label>
              <Input
                id="scheduledDate"
                type="date"
                aria-invalid={!!errors.scheduledDate}
                aria-describedby={errors.scheduledDate ? 'date-error' : undefined}
                {...register('scheduledDate')}
              />
              {errors.scheduledDate && (
                <p id="date-error" role="alert" className="text-xs text-red-600">
                  {errors.scheduledDate.message}
                </p>
              )}
            </div>

            {/* Time Slots */}
            {watchedDate && (
              <div className="space-y-1.5">
                <Label>Giờ khám *</Label>
                {slotsLoading && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Spinner size="sm" />
                    Đang tải khung giờ...
                  </div>
                )}
                {!slotsLoading && slots.length === 0 && (
                  <Alert variant="warning">
                    <AlertDescription>Không có khung giờ khả dụng cho ngày này.</AlertDescription>
                  </Alert>
                )}
                {!slotsLoading && slots.length > 0 && (
                  <Controller
                    name="scheduledTime"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                        {slots.map((slot) => {
                          const isSelected = field.value === slot.time;
                          const isDisabled = !slot.available;

                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => field.onChange(slot.time)}
                              className={`rounded-lg border px-2 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--color-primary)] ${
                                isSelected
                                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                                  : isDisabled
                                  ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300'
                                  : slot.customerAlreadyBooked
                                  ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-[var(--color-primary)] hover:bg-blue-50'
                              }`}
                              title={
                                slot.customerAlreadyBooked
                                  ? 'Khách hàng đã có lịch trong giờ này'
                                  : undefined
                              }
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                )}
                {errors.scheduledTime && (
                  <p role="alert" className="text-xs text-red-600">
                    {errors.scheduledTime.message}
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                rows={3}
                placeholder="Ghi chú thêm (không bắt buộc)..."
                {...register('notes')}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: '/admin/bookings' })}
              >
                Huỷ
              </Button>
              <Button type="submit" disabled={createBooking.isPending}>
                {createBooking.isPending && <Spinner size="sm" />}
                Tạo lịch hẹn
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
