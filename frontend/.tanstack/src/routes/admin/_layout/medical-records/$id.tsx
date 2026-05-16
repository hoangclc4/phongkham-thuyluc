import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useMedicalRecord,
  useUpdateMedicalRecord,
  useUpdateSharing,
  useUploadAttachment,
  useDeleteAttachment,
} from '@/hooks/use-medical-records';
import { useToast } from '@/hooks/use-toast';
import { TreatmentPlanEditor } from '@/components/medical-records/TreatmentPlanEditor';
import { formatDate, formatDateTime } from '@/lib/formatDate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { TreatmentItem, CreateMedicalRecordDto } from '@/types/medical-record';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = 'image/*,application/pdf';

const editSchema = z.object({
  visitDate: z.string().min(1),
  weightAtVisit: z.number().positive().optional(),
  temperatureCelsius: z.number().positive().optional(),
  chiefComplaint: z.string().min(1, 'Vui lòng nhập triệu chứng chính'),
  physicalExamination: z.string().optional(),
  diagnosis: z.string().min(1, 'Vui lòng nhập chẩn đoán'),
  diagnosisNotes: z.string().optional(),
  doctorNotes: z.string().optional(),
  followupDate: z.string().optional(),
  followupNotes: z.string().optional(),
  requiresAttention: z.boolean(),
  attentionReason: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

export const Route = createFileRoute('/admin/_layout/medical-records/$id')({
  component: MedicalRecordDetail,
});

function MedicalRecordDetail() {
  const { id } = Route.useParams();
  const { toast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [editTreatmentPlan, setEditTreatmentPlan] = useState<Omit<TreatmentItem, 'id'>[]>([]);
  const [deleteAttachmentId, setDeleteAttachmentId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: record, isLoading, isError } = useMedicalRecord(id);
  const updateRecord = useUpdateMedicalRecord();
  const updateSharing = useUpdateSharing();
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  });

  function openEditDialog() {
    if (!record) return;
    editForm.reset({
      visitDate: record.visitDate.slice(0, 10),
      weightAtVisit: record.weightAtVisit ?? undefined,
      temperatureCelsius: record.temperatureCelsius ?? undefined,
      chiefComplaint: record.chiefComplaint,
      physicalExamination: record.physicalExamination ?? '',
      diagnosis: record.diagnosis,
      diagnosisNotes: record.diagnosisNotes ?? '',
      doctorNotes: record.doctorNotes ?? '',
      followupDate: record.followupDate?.slice(0, 10) ?? '',
      followupNotes: record.followupNotes ?? '',
      requiresAttention: record.requiresAttention,
      attentionReason: record.attentionReason ?? '',
    });
    setEditTreatmentPlan(
      record.treatmentPlan.map(({ id: _id, ...rest }) => rest),
    );
    setEditOpen(true);
  }

  async function onEditSubmit(values: EditFormValues) {
    const dto: Partial<CreateMedicalRecordDto> = {
      visitDate: values.visitDate,
      weightAtVisit: values.weightAtVisit,
      temperatureCelsius: values.temperatureCelsius,
      chiefComplaint: values.chiefComplaint,
      physicalExamination: values.physicalExamination || undefined,
      diagnosis: values.diagnosis,
      diagnosisNotes: values.diagnosisNotes || undefined,
      treatmentPlan: editTreatmentPlan,
      doctorNotes: values.doctorNotes || undefined,
      followupDate: values.followupDate || undefined,
      followupNotes: values.followupNotes || undefined,
      requiresAttention: values.requiresAttention,
      attentionReason: values.requiresAttention ? values.attentionReason : undefined,
    };
    await updateRecord.mutateAsync({ id, dto });
    toast({ title: 'Đã lưu hồ sơ' });
    setEditOpen(false);
  }

  async function handleSharingToggle(checked: boolean) {
    await updateSharing.mutateAsync({ id, isShared: checked });
    toast({ title: checked ? 'Đã bật chia sẻ' : 'Đã tắt chia sẻ' });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({ title: 'File quá lớn', description: 'Tối đa 10MB', variant: 'destructive' });
      return;
    }
    await uploadAttachment.mutateAsync({ id, file });
    toast({ title: 'Đã tải lên file đính kèm' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function confirmDeleteAttachment() {
    if (!deleteAttachmentId) return;
    await deleteAttachment.mutateAsync({ id, attachmentId: deleteAttachmentId });
    toast({ title: 'Đã xoá file đính kèm' });
    setDeleteAttachmentId(null);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !record) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Không thể tải hồ sơ bệnh lý. Vui lòng thử lại.</AlertDescription>
      </Alert>
    );
  }

  const hasAllergies = record.pet.knownAllergies.length > 0;
  const requiresAttentionWatch = editForm.watch('requiresAttention');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/admin/medical-records" className="hover:text-gray-900">
          Hồ sơ bệnh lý
        </Link>
        <span>/</span>
        <span className="font-mono text-gray-900">{record.displayNumber}</span>
      </nav>

      {hasAllergies && (
        <Alert variant="warning">
          <AlertDescription>
            &#9888;&#65039; <strong>{record.pet.name}</strong> có dị ứng với:{' '}
            {record.pet.knownAllergies.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="font-mono text-xs">
              {record.displayNumber}
            </Badge>
            {record.requiresAttention && (
              <Badge variant="destructive">&#9888;&#65039; Cần chú ý</Badge>
            )}
          </div>
          <h1 className="mt-1 text-xl font-bold text-gray-900">
            {record.pet.name}
            <span className="ml-2 text-sm font-normal text-gray-500">
              — {record.pet.ownerName} ({record.pet.ownerPhone})
            </span>
          </h1>
          <p className="text-sm text-gray-500">{formatDate(record.visitDate)}</p>
        </div>
        <Button onClick={openEditDialog} variant="outline">
          Sửa
        </Button>
      </div>

      {/* Thông tin cơ bản */}
      <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Thông tin cơ bản</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-gray-500">Thú cưng</dt>
            <dd className="font-medium text-gray-900">{record.pet.name}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Loài</dt>
            <dd className="font-medium text-gray-900">{record.pet.species}</dd>
          </div>
          {record.linkedBooking && (
            <div>
              <dt className="text-gray-500">Booking liên kết</dt>
              <dd className="font-mono text-xs font-medium text-gray-900">
                {record.linkedBooking.displayNumber}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-gray-500">Ngày khám</dt>
            <dd className="font-medium text-gray-900">{formatDate(record.visitDate)}</dd>
          </div>
          {record.weightAtVisit !== null && (
            <div>
              <dt className="text-gray-500">Cân nặng</dt>
              <dd className="font-medium text-gray-900">{record.weightAtVisit} kg</dd>
            </div>
          )}
          {record.temperatureCelsius !== null && (
            <div>
              <dt className="text-gray-500">Nhiệt độ</dt>
              <dd className="font-medium text-gray-900">{record.temperatureCelsius}°C</dd>
            </div>
          )}
        </dl>
      </section>

      {/* Triệu chứng */}
      <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Triệu chứng &amp; Khám lâm sàng</h2>
        <div>
          <p className="text-xs font-medium text-gray-500">Triệu chứng chính</p>
          <p className="mt-0.5 text-sm text-gray-900 whitespace-pre-wrap">{record.chiefComplaint}</p>
        </div>
        {record.physicalExamination && (
          <div>
            <p className="text-xs font-medium text-gray-500">Kết quả khám lâm sàng</p>
            <p className="mt-0.5 text-sm text-gray-900 whitespace-pre-wrap">{record.physicalExamination}</p>
          </div>
        )}
      </section>

      {/* Chẩn đoán */}
      <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Chẩn đoán</h2>
        <div>
          <p className="text-xs font-medium text-gray-500">Chẩn đoán</p>
          <p className="mt-0.5 text-sm text-gray-900 whitespace-pre-wrap">{record.diagnosis}</p>
        </div>
        {record.diagnosisNotes && (
          <div>
            <p className="text-xs font-medium text-gray-500">Ghi chú chẩn đoán</p>
            <p className="mt-0.5 text-sm text-gray-900 whitespace-pre-wrap">{record.diagnosisNotes}</p>
          </div>
        )}
      </section>

      {/* Phác đồ điều trị */}
      <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Phác đồ điều trị</h2>
        {record.treatmentPlan.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có phác đồ điều trị.</p>
        ) : (
          <div className="space-y-2">
            {record.treatmentPlan.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                <p className="font-medium text-gray-900">{item.drug}</p>
                <p className="text-gray-600">
                  {item.dosage} — {item.frequency} — {item.duration} — Đường dùng: {item.route}
                </p>
                {item.notes && <p className="text-gray-500 italic">{item.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Theo dõi */}
      <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Theo dõi</h2>
        {record.doctorNotes && (
          <div>
            <p className="text-xs font-medium text-gray-500">Ghi chú bác sĩ</p>
            <p className="mt-0.5 text-sm text-gray-900 whitespace-pre-wrap">{record.doctorNotes}</p>
          </div>
        )}
        {record.followupDate && (
          <div>
            <p className="text-xs font-medium text-gray-500">Ngày tái khám</p>
            <p className="mt-0.5 text-sm text-gray-900">{formatDate(record.followupDate)}</p>
          </div>
        )}
        {record.followupNotes && (
          <div>
            <p className="text-xs font-medium text-gray-500">Ghi chú tái khám</p>
            <p className="mt-0.5 text-sm text-gray-900">{record.followupNotes}</p>
          </div>
        )}
        {record.requiresAttention && record.attentionReason && (
          <div>
            <p className="text-xs font-medium text-red-500">Lý do cần chú ý</p>
            <p className="mt-0.5 text-sm text-red-700">{record.attentionReason}</p>
          </div>
        )}
      </section>

      {/* Đính kèm */}
      <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="text-base font-semibold text-gray-900">File đính kèm</h2>
        {record.attachments.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có file đính kèm.</p>
        ) : (
          <ul className="space-y-2">
            {record.attachments.map((att) => (
              <li key={att.id} className="flex items-center justify-between rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-primary)] hover:underline"
                >
                  {att.filename}
                </a>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{formatDateTime(att.uploadedAt)}</span>
                  <button
                    type="button"
                    onClick={() => setDeleteAttachmentId(att.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Xoá
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div>
          <Label htmlFor="file-upload" className="block mb-1">
            Tải lên file mới
          </Label>
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleFileUpload}
            className="text-sm text-gray-700 file:mr-3 file:rounded file:border file:border-gray-300 file:bg-white file:px-3 file:py-1 file:text-xs file:text-gray-700 hover:file:bg-gray-50"
          />
          {uploadAttachment.isPending && (
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <Spinner size="sm" /> Đang tải lên...
            </div>
          )}
        </div>
      </section>

      {/* Chia sẻ */}
      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-base font-semibold text-gray-900">Chia sẻ với khách hàng</h2>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={record.isSharedWithCustomer}
            onChange={(e) => handleSharingToggle(e.target.checked)}
            disabled={updateSharing.isPending}
            className="h-4 w-4 rounded border-gray-300"
          />
          Cho phép khách hàng xem hồ sơ này
          {updateSharing.isPending && <Spinner size="sm" />}
        </label>
      </section>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sửa hồ sơ bệnh lý</DialogTitle>
          </DialogHeader>

          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="edit-visitDate">Ngày khám</Label>
                <Input
                  id="edit-visitDate"
                  type="date"
                  {...editForm.register('visitDate')}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-weight">Cân nặng (kg)</Label>
                <Input
                  id="edit-weight"
                  type="number"
                  step="0.1"
                  min="0"
                  {...editForm.register('weightAtVisit', { valueAsNumber: true })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-temp">Nhiệt độ (°C)</Label>
                <Input
                  id="edit-temp"
                  type="number"
                  step="0.1"
                  min="0"
                  {...editForm.register('temperatureCelsius', { valueAsNumber: true })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-chiefComplaint">Triệu chứng chính</Label>
              <Textarea
                id="edit-chiefComplaint"
                {...editForm.register('chiefComplaint')}
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-physicalExam">Kết quả khám lâm sàng</Label>
              <Textarea
                id="edit-physicalExam"
                {...editForm.register('physicalExamination')}
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-diagnosis">Chẩn đoán</Label>
              <Textarea
                id="edit-diagnosis"
                {...editForm.register('diagnosis')}
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-diagnosisNotes">Ghi chú chẩn đoán</Label>
              <Textarea
                id="edit-diagnosisNotes"
                {...editForm.register('diagnosisNotes')}
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="mb-2 block">Phác đồ điều trị</Label>
              <TreatmentPlanEditor value={editTreatmentPlan} onChange={setEditTreatmentPlan} />
            </div>

            <div>
              <Label htmlFor="edit-doctorNotes">Ghi chú bác sĩ</Label>
              <Textarea
                id="edit-doctorNotes"
                {...editForm.register('doctorNotes')}
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-followupDate">Ngày tái khám</Label>
                <Input
                  id="edit-followupDate"
                  type="date"
                  {...editForm.register('followupDate')}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-followupNotes">Ghi chú tái khám</Label>
                <Input
                  id="edit-followupNotes"
                  {...editForm.register('followupNotes')}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Controller
                name="requiresAttention"
                control={editForm.control}
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
              {requiresAttentionWatch && (
                <div>
                  <Label htmlFor="edit-attentionReason">Lý do</Label>
                  <Input
                    id="edit-attentionReason"
                    {...editForm.register('attentionReason')}
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={updateRecord.isPending}>
                {updateRecord.isPending ? (
                  <>
                    <Spinner size="sm" /> Đang lưu...
                  </>
                ) : (
                  'Lưu thay đổi'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Attachment Dialog */}
      <Dialog
        open={deleteAttachmentId !== null}
        onOpenChange={(open) => { if (!open) setDeleteAttachmentId(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xoá file</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Bạn có chắc muốn xoá file đính kèm này không?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAttachmentId(null)}>
              Huỷ
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteAttachment}
              disabled={deleteAttachment.isPending}
            >
              {deleteAttachment.isPending ? <Spinner size="sm" /> : 'Xoá'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
