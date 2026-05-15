import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePets } from '@/hooks/use-pets';
import { useCreateMedicalRecord } from '@/hooks/use-medical-records';
import { useToast } from '@/hooks/use-toast';
import { TreatmentPlanEditor } from '@/components/medical-records/TreatmentPlanEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import type { TreatmentItem } from '@/types/medical-record';

const TODAY_DATE = new Date().toISOString().slice(0, 10);

const createMedicalRecordSchema = z.object({
  petId: z.string().min(1, 'Vui lòng chọn thú cưng'),
  bookingId: z.string().optional(),
  visitDate: z.string().min(1, 'Vui lòng chọn ngày khám'),
  weightAtVisit: z.number().positive().optional(),
  temperatureCelsius: z.number().positive().optional(),
  chiefComplaint: z.string().min(1, 'Vui lòng nhập triệu chứng chính'),
  physicalExamination: z.string().optional(),
  diagnosis: z.string().min(1, 'Vui lòng nhập chẩn đoán'),
  diagnosisNotes: z.string().optional(),
  doctorNotes: z.string().optional(),
  followupDate: z.string().optional(),
  followupNotes: z.string().optional(),
  isSharedWithCustomer: z.boolean(),
  requiresAttention: z.boolean(),
  attentionReason: z.string().optional(),
});

type FormValues = z.infer<typeof createMedicalRecordSchema>;

interface SearchParams {
  petId?: string;
  bookingId?: string;
}

export const Route = createFileRoute('/admin/_layout/medical-records/new')({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    petId: typeof search.petId === 'string' ? search.petId : undefined,
    bookingId: typeof search.bookingId === 'string' ? search.bookingId : undefined,
  }),
  component: NewMedicalRecord,
});

function NewMedicalRecord() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/admin/_layout/medical-records/new' });
  const { toast } = useToast();

  const [petSearchQuery, setPetSearchQuery] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState<Omit<TreatmentItem, 'id'>[]>([]);

  const { data: petsData, isLoading: petsLoading } = usePets({
    search: petSearchQuery || undefined,
    limit: 20,
  });

  const createMedicalRecord = useCreateMedicalRecord();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createMedicalRecordSchema),
    defaultValues: {
      petId: search.petId ?? '',
      bookingId: search.bookingId ?? '',
      visitDate: TODAY_DATE,
      isSharedWithCustomer: false,
      requiresAttention: false,
    },
  });

  const requiresAttention = watch('requiresAttention');

  async function onSubmit(values: FormValues) {
    const result = await createMedicalRecord.mutateAsync({
      petId: values.petId,
      bookingId: values.bookingId || undefined,
      visitDate: values.visitDate,
      weightAtVisit: values.weightAtVisit,
      temperatureCelsius: values.temperatureCelsius,
      chiefComplaint: values.chiefComplaint,
      physicalExamination: values.physicalExamination || undefined,
      diagnosis: values.diagnosis,
      diagnosisNotes: values.diagnosisNotes || undefined,
      treatmentPlan: treatmentPlan.length > 0 ? treatmentPlan : undefined,
      doctorNotes: values.doctorNotes || undefined,
      followupDate: values.followupDate || undefined,
      followupNotes: values.followupNotes || undefined,
      isSharedWithCustomer: values.isSharedWithCustomer,
      requiresAttention: values.requiresAttention,
      attentionReason: values.requiresAttention ? values.attentionReason : undefined,
    });
    toast({ title: 'Tạo hồ sơ thành công', description: result.displayNumber });
    navigate({ to: '/admin/medical-records/$id', params: { id: result.id } });
  }

  const selectedPetId = watch('petId');
  const selectedPet = petsData?.data.find((p) => p.id === selectedPetId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/admin/medical-records" className="hover:text-gray-900">
          Hồ sơ bệnh lý
        </Link>
        <span>/</span>
        <span className="text-gray-900">Tạo mới</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">Tạo hồ sơ bệnh lý</h1>

      {createMedicalRecord.isError && (
        <Alert variant="destructive">
          <AlertDescription>Không thể tạo hồ sơ. Vui lòng thử lại.</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Thông tin cơ bản */}
        <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Thông tin cơ bản</h2>

          <div>
            <Label htmlFor="pet-search">
              Thú cưng <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pet-search"
              placeholder="Tìm tên thú cưng..."
              value={petSearchQuery}
              onChange={(e) => setPetSearchQuery(e.target.value)}
              className="mt-1"
            />
            {petsLoading && petSearchQuery && (
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                <Spinner size="sm" /> Đang tìm...
              </div>
            )}
            {petsData && petsData.data.length > 0 && petSearchQuery && (
              <ul className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                {petsData.data.map((pet) => (
                  <li key={pet.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                      onClick={() => {
                        setValue('petId', pet.id, { shouldValidate: true });
                        setPetSearchQuery(pet.name);
                      }}
                    >
                      <span className="font-medium">{pet.name}</span>
                      <span className="ml-2 text-gray-500">
                        ({pet.speciesLabel}) — {pet.ownerName}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {selectedPet && (
              <p className="mt-1 text-xs text-green-700">
                Đã chọn: {selectedPet.name} ({selectedPet.speciesLabel}) — Chủ: {selectedPet.ownerName}
              </p>
            )}
            {errors.petId && (
              <p className="mt-1 text-xs text-red-600">{errors.petId.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="bookingId">Booking liên kết (tuỳ chọn)</Label>
            <Input
              id="bookingId"
              {...register('bookingId')}
              placeholder="ID booking"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="visitDate">
                Ngày khám <span className="text-red-500">*</span>
              </Label>
              <Input
                id="visitDate"
                type="date"
                {...register('visitDate')}
                className="mt-1"
              />
              {errors.visitDate && (
                <p className="mt-1 text-xs text-red-600">{errors.visitDate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="weightAtVisit">Cân nặng (kg)</Label>
              <Input
                id="weightAtVisit"
                type="number"
                step="0.1"
                min="0"
                {...register('weightAtVisit', { valueAsNumber: true })}
                placeholder="0.0"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="temperatureCelsius">Nhiệt độ (°C)</Label>
              <Input
                id="temperatureCelsius"
                type="number"
                step="0.1"
                min="0"
                {...register('temperatureCelsius', { valueAsNumber: true })}
                placeholder="38.5"
                className="mt-1"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Triệu chứng & Khám lâm sàng */}
        <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Triệu chứng &amp; Khám lâm sàng</h2>

          <div>
            <Label htmlFor="chiefComplaint">
              Triệu chứng chính <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="chiefComplaint"
              {...register('chiefComplaint')}
              rows={3}
              placeholder="Mô tả triệu chứng chính..."
              className="mt-1"
            />
            {errors.chiefComplaint && (
              <p className="mt-1 text-xs text-red-600">{errors.chiefComplaint.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="physicalExamination">Kết quả khám lâm sàng</Label>
            <Textarea
              id="physicalExamination"
              {...register('physicalExamination')}
              rows={3}
              placeholder="Kết quả khám lâm sàng..."
              className="mt-1"
            />
          </div>
        </section>

        {/* Section 3: Chẩn đoán */}
        <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Chẩn đoán</h2>

          <div>
            <Label htmlFor="diagnosis">
              Chẩn đoán <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="diagnosis"
              {...register('diagnosis')}
              rows={3}
              placeholder="Chẩn đoán bệnh..."
              className="mt-1"
            />
            {errors.diagnosis && (
              <p className="mt-1 text-xs text-red-600">{errors.diagnosis.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="diagnosisNotes">Ghi chú chẩn đoán</Label>
            <Textarea
              id="diagnosisNotes"
              {...register('diagnosisNotes')}
              rows={2}
              placeholder="Ghi chú thêm..."
              className="mt-1"
            />
          </div>
        </section>

        {/* Section 4: Phác đồ điều trị */}
        <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Phác đồ điều trị</h2>
          <TreatmentPlanEditor value={treatmentPlan} onChange={setTreatmentPlan} />
        </section>

        {/* Section 5: Theo dõi */}
        <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Theo dõi</h2>

          <div>
            <Label htmlFor="doctorNotes">Ghi chú bác sĩ</Label>
            <Textarea
              id="doctorNotes"
              {...register('doctorNotes')}
              rows={3}
              placeholder="Ghi chú nội bộ của bác sĩ..."
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="followupDate">Ngày tái khám</Label>
              <Input
                id="followupDate"
                type="date"
                {...register('followupDate')}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="followupNotes">Ghi chú tái khám</Label>
              <Input
                id="followupNotes"
                {...register('followupNotes')}
                placeholder="Ghi chú về tái khám..."
                className="mt-1"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Controller
              name="requiresAttention"
              control={control}
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Cần chú ý đặc biệt
                </label>
              )}
            />

            {requiresAttention && (
              <div>
                <Label htmlFor="attentionReason">
                  Lý do <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="attentionReason"
                  {...register('attentionReason')}
                  placeholder="Lý do cần chú ý..."
                  className="mt-1"
                />
              </div>
            )}
          </div>
        </section>

        {/* Section 6: Chia sẻ với khách */}
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Chia sẻ với khách hàng</h2>
          <Controller
            name="isSharedWithCustomer"
            control={control}
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Cho phép khách hàng xem hồ sơ này
              </label>
            )}
          />
        </section>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link to="/admin/medical-records">Huỷ</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting || createMedicalRecord.isPending}>
            {createMedicalRecord.isPending ? (
              <>
                <Spinner size="sm" /> Đang lưu...
              </>
            ) : (
              'Tạo hồ sơ'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
