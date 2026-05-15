import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMyPets, useMyBookingSlots, useCreateMyBooking } from '@/hooks/use-customer-portal';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { SERVICE_TYPE_LABELS, type ServiceType } from '@/types/booking';
import { ChevronLeft } from 'lucide-react';

const TODAY_DATE = new Date().toISOString().slice(0, 10);

const newBookingSchema = z.object({
  petId: z.string().min(1, 'Vui lòng chọn thú cưng'),
  serviceType: z.string().min(1, 'Vui lòng chọn dịch vụ'),
  date: z.string().min(1, 'Vui lòng chọn ngày'),
  slot: z.string().min(1, 'Vui lòng chọn giờ'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof newBookingSchema>;

export const Route = createFileRoute('/customer/_layout/bookings/new')({
  component: NewCustomerBookingPage,
});

function NewCustomerBookingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: pets, isLoading: petsLoading } = useMyPets();
  const createBooking = useCreateMyBooking();

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(newBookingSchema),
    defaultValues: {
      petId: '',
      serviceType: '',
      date: TODAY_DATE,
      slot: '',
      notes: '',
    },
  });

  const selectedDate = watch('date');
  const selectedSlot = watch('slot');

  const { data: slots, isLoading: slotsLoading } = useMyBookingSlots(selectedDate);

  const availableSlots = slots?.filter((s) => s.available) ?? [];

  async function onSubmit(values: FormValues) {
    const scheduledAt = `${values.date}T${values.slot}:00+07:00`;
    await createBooking.mutateAsync({
      petId: values.petId,
      serviceType: values.serviceType as ServiceType,
      scheduledAt,
      notes: values.notes || undefined,
    });
    toast({ title: 'Đặt lịch thành công!', description: 'Phòng khám sẽ xác nhận lịch hẹn của bạn.' });
    navigate({ to: '/customer/bookings' });
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

      <h1 className="text-xl font-bold text-gray-900">Đặt lịch khám</h1>

      {createBooking.isError && (
        <Alert variant="destructive">
          <AlertDescription>Không thể đặt lịch. Vui lòng thử lại.</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardContent className="p-5 space-y-4">
            {/* Pet selection */}
            <div>
              <Label>
                Thú cưng <span className="text-red-500">*</span>
              </Label>
              {petsLoading ? (
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <Spinner size="sm" /> Đang tải...
                </div>
              ) : (
                <Controller
                  name="petId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Chọn thú cưng" />
                      </SelectTrigger>
                      <SelectContent>
                        {pets?.map((pet) => (
                          <SelectItem key={pet.id} value={pet.id}>
                            {pet.name} ({pet.speciesLabel})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {errors.petId && (
                <p className="mt-1 text-xs text-red-600">{errors.petId.message}</p>
              )}
            </div>

            {/* Service type */}
            <div>
              <Label>
                Dịch vụ <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="serviceType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Chọn dịch vụ" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(SERVICE_TYPE_LABELS) as [ServiceType, string][]).map(
                        ([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.serviceType && (
                <p className="mt-1 text-xs text-red-600">{errors.serviceType.message}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <Label htmlFor="booking-date">
                Ngày khám <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <Input
                    id="booking-date"
                    type="date"
                    min={TODAY_DATE}
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e);
                      setValue('slot', '');
                    }}
                    className="mt-1"
                  />
                )}
              />
              {errors.date && (
                <p className="mt-1 text-xs text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Time slot */}
            <div>
              <Label>
                Giờ khám <span className="text-red-500">*</span>
              </Label>
              {slotsLoading ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                  <Spinner size="sm" /> Đang tải khung giờ...
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">
                  Không có khung giờ trống. Vui lòng chọn ngày khác.
                </p>
              ) : (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {availableSlots.map((s) => (
                    <button
                      key={s.time}
                      type="button"
                      onClick={() => setValue('slot', s.time, { shouldValidate: true })}
                      className={cn(
                        'rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]',
                        selectedSlot === s.time
                          ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                          : 'border-gray-200 text-gray-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]',
                      )}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              )}
              {errors.slot && (
                <p className="mt-1 text-xs text-red-600">{errors.slot.message}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="booking-notes">Ghi chú (tuỳ chọn)</Label>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <Textarea
                    id="booking-notes"
                    rows={3}
                    placeholder="Triệu chứng, yêu cầu đặc biệt..."
                    {...field}
                    className="mt-1"
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="w-full min-h-[52px] text-base"
          disabled={createBooking.isPending}
        >
          {createBooking.isPending ? (
            <>
              <Spinner size="sm" /> Đang đặt lịch...
            </>
          ) : (
            'Xác nhận đặt lịch'
          )}
        </Button>
      </form>
    </div>
  );
}
