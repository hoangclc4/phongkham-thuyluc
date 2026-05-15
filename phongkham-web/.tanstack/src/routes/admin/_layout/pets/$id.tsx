import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { usePet, useUpdatePet, usePetMedicalRecords } from '@/hooks/use-pets';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { formatDate, formatDateTime } from '@/lib/formatDate';
import {
  PET_SPECIES_LABELS,
  PET_STATUS_LABELS,
  PET_GENDER_LABELS,
  type PetSpecies,
  type PetStatus,
  type PetGender,
  type Pet,
} from '@/types/pet';
import type { MedicalRecord } from '@/types/medical-record';

const editPetSchema = z.object({
  name: z.string().min(1, 'Tên không được để trống'),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'reptile', 'other'] as const),
  breed: z.string().optional(),
  gender: z.enum(['male', 'female', 'unknown'] as const).optional(),
  dateOfBirth: z.string().optional(),
  weightKg: z.number({ invalid_type_error: 'Nhập số hợp lệ' }).positive().optional(),
  color: z.string().optional(),
  status: z.enum(['healthy', 'in_treatment', 'monitoring', 'deceased', 'transferred'] as const),
  isNeutered: z.boolean().optional(),
  notes: z.string().optional(),
});

type EditPetFormValues = z.infer<typeof editPetSchema>;

export const Route = createFileRoute('/admin/_layout/pets/$id')({
  component: PetDetailPage,
});

function PetDetailPage() {
  const { id } = Route.useParams();
  const { data: pet, isLoading, isError } = usePet(id);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <PetDetailSkeleton />;

  if (isError || !pet) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Không thể tải thông tin thú cưng.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {pet.knownAllergies.length > 0 && (
        <AllergyAlert petName={pet.name} allergies={pet.knownAllergies} />
      )}

      <PetHeader pet={pet} onEdit={() => setEditOpen(true)} />

      <PetMedicalRecordsSection petId={id} />

      {pet.upcomingAppointment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lịch hẹn sắp tới</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{pet.upcomingAppointment.displayNumber}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {formatDateTime(pet.upcomingAppointment.scheduledAt)}
                </p>
              </div>
              <Link
                to="/admin/bookings/$id"
                params={{ id: pet.upcomingAppointment.id }}
              >
                <Button variant="outline" size="sm">
                  Xem lịch hẹn
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <EditPetDialog
        pet={pet}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </div>
  );
}

function PetHeader({ pet, onEdit }: { pet: Pet; onEdit: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <Avatar src={pet.avatarUrl} name={pet.name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{pet.name}</h1>
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
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
            {pet.breed && <span>Giống: {pet.breed}</span>}
            <span>Giới tính: {PET_GENDER_LABELS[pet.gender]}</span>
            {pet.ageDisplay && <span>Tuổi: {pet.ageDisplay}</span>}
            {pet.weightKg != null && <span>Cân nặng: {pet.weightKg} kg</span>}
            {pet.color && <span>Màu lông: {pet.color}</span>}
          </div>
          <Link
            to="/admin/customers/$id"
            params={{ id: pet.customerId }}
            className="text-sm text-[var(--color-primary)] hover:underline mt-1 inline-block"
          >
            Xem chủ → {pet.ownerName}
          </Link>
        </div>
        <Button variant="outline" onClick={onEdit}>
          Chỉnh sửa
        </Button>
      </div>
    </div>
  );
}

function PetMedicalRecordsSection({ petId }: { petId: string }) {
  const { data: records, isLoading, isError } = usePetMedicalRecords(petId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lịch sử bệnh lý</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        )}
        {isError && (
          <Alert variant="destructive">
            <AlertDescription>Không thể tải hồ sơ bệnh lý.</AlertDescription>
          </Alert>
        )}
        {!isLoading && !isError && (!records || records.length === 0) && (
          <p className="text-gray-500 text-sm">Chưa có hồ sơ bệnh lý.</p>
        )}
        {!isLoading && records && records.length > 0 && (
          <div className="space-y-3">
            {records.map((record) => (
              <MedicalRecordItem key={record.id} record={record} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MedicalRecordItem({ record }: { record: MedicalRecord }) {
  return (
    <div className="flex items-start gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="w-1 self-stretch bg-[var(--color-primary)]/30 rounded-full shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-gray-900">{record.displayNumber}</span>
          <span className="text-sm text-gray-500">{record.diagnosis}</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{formatDate(record.visitDate)}</p>
      </div>
      <Link to="/admin/medical-records/$id" params={{ id: record.id }}>
        <Button variant="ghost" size="sm">
          Xem chi tiết
        </Button>
      </Link>
    </div>
  );
}

interface EditPetDialogProps {
  pet: Pet;
  open: boolean;
  onClose: () => void;
}

function EditPetDialog({ pet, open, onClose }: EditPetDialogProps) {
  const updatePet = useUpdatePet();
  const [allergies, setAllergies] = useState<string[]>(pet.knownAllergies);
  const [allergyInput, setAllergyInput] = useState('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EditPetFormValues>({
    resolver: zodResolver(editPetSchema),
    defaultValues: {
      name: pet.name,
      species: pet.species,
      breed: pet.breed ?? '',
      gender: pet.gender,
      dateOfBirth: pet.dateOfBirth ?? '',
      weightKg: pet.weightKg ?? undefined,
      color: pet.color ?? '',
      status: pet.status,
      isNeutered: pet.isNeutered,
      notes: pet.notes ?? '',
    },
  });

  function addAllergy() {
    const trimmed = allergyInput.trim();
    if (!trimmed || allergies.includes(trimmed)) return;
    setAllergies((prev) => [...prev, trimmed]);
    setAllergyInput('');
  }

  function removeAllergy(allergyToRemove: string) {
    setAllergies((prev) => prev.filter((a) => a !== allergyToRemove));
  }

  function handleAllergyKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    addAllergy();
  }

  function onSubmit(values: EditPetFormValues) {
    updatePet.mutate(
      {
        id: pet.id,
        dto: {
          name: values.name,
          species: values.species as PetSpecies,
          breed: values.breed || undefined,
          gender: values.gender as PetGender | undefined,
          dateOfBirth: values.dateOfBirth || undefined,
          weightKg: values.weightKg,
          color: values.color || undefined,
          status: values.status as PetStatus,
          knownAllergies: allergies,
          isNeutered: values.isNeutered,
          notes: values.notes || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: 'Cập nhật thành công' });
          onClose();
        },
        onError: () =>
          toast({ title: 'Cập nhật thất bại', variant: 'destructive' }),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa thú cưng</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Tên</Label>
            <Input id="edit-name" {...register('name')} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-species">Loài</Label>
              <Controller
                name="species"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="edit-species">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PET_SPECIES_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-gender">Giới tính</Label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger id="edit-gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PET_GENDER_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-status">Trạng thái</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PET_STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-breed">Giống</Label>
            <Input id="edit-breed" {...register('breed')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-dateOfBirth">Ngày sinh</Label>
              <Input id="edit-dateOfBirth" type="date" {...register('dateOfBirth')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-weightKg">Cân nặng (kg)</Label>
              <Input
                id="edit-weightKg"
                type="number"
                step="0.1"
                {...register('weightKg', { valueAsNumber: true })}
              />
              {errors.weightKg && (
                <p className="text-xs text-red-600">{errors.weightKg.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-color">Màu lông</Label>
            <Input id="edit-color" {...register('color')} />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="edit-isNeutered"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 accent-[var(--color-primary)]"
              {...register('isNeutered')}
            />
            <Label htmlFor="edit-isNeutered" className="cursor-pointer">
              Đã triệt sản
            </Label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-allergyInput">Dị ứng</Label>
            <div className="flex gap-2">
              <Input
                id="edit-allergyInput"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={handleAllergyKeyDown}
                placeholder="Nhập và nhấn Enter..."
              />
              <Button type="button" variant="outline" onClick={addAllergy}>
                Thêm
              </Button>
            </div>
            {allergies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {allergies.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-medium"
                  >
                    {a}
                    <button
                      type="button"
                      onClick={() => removeAllergy(a)}
                      className="hover:text-amber-900"
                      aria-label={`Xoá ${a}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-notes">Ghi chú</Label>
            <Textarea id="edit-notes" {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" disabled={updatePet.isPending}>
              {updatePet.isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PetDetailSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}
