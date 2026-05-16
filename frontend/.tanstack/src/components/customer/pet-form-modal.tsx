import { useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';
import { useCreateMyPet, useUpdateMyPet, useUploadMyPetAvatar } from '@/hooks/use-customer-portal';
import { PET_SPECIES_LABELS, PET_GENDER_LABELS, type Pet } from '@/types/pet';

const PET_SPECIES_OPTIONS = [
  { value: 'dog', label: PET_SPECIES_LABELS.dog },
  { value: 'cat', label: PET_SPECIES_LABELS.cat },
  { value: 'bird', label: PET_SPECIES_LABELS.bird },
  { value: 'rabbit', label: PET_SPECIES_LABELS.rabbit },
  { value: 'hamster', label: PET_SPECIES_LABELS.hamster },
  { value: 'reptile', label: PET_SPECIES_LABELS.reptile },
  { value: 'other', label: PET_SPECIES_LABELS.other },
] as const;

const PET_GENDER_OPTIONS = [
  { value: 'male', label: PET_GENDER_LABELS.male },
  { value: 'female', label: PET_GENDER_LABELS.female },
  { value: 'unknown', label: PET_GENDER_LABELS.unknown },
] as const;

const petFormSchema = z.object({
  name: z.string().min(1, 'Bắt buộc nhập tên').max(50, 'Tối đa 50 ký tự'),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'reptile', 'other'] as const),
  gender: z.enum(['male', 'female', 'unknown'] as const),
  breed: z.string().optional(),
  dateOfBirth: z.string().optional(),
  color: z.string().optional(),
  weightKg: z.preprocess(
    (v) => (v === '' || v == null ? undefined : String(v)),
    z.string().regex(/^\d+(\.\d{1,2})?$/, 'Nhập số hợp lệ (vd: 3.5)').optional(),
  ),
  isNeutered: z.boolean(),
  knownAllergiesText: z.string().optional(),
  notes: z.string().optional(),
});

type PetFormValues = z.infer<typeof petFormSchema>;

interface PetFormModalProps {
  open: boolean;
  onClose: () => void;
  pet?: Pet;
}

export function PetFormModal({ open, onClose, pet }: PetFormModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(pet?.avatarUrl ?? null);

  const isEditMode = Boolean(pet);

  const createPet = useCreateMyPet();
  const updatePet = useUpdateMyPet();
  const uploadAvatar = useUploadMyPetAvatar();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PetFormValues>({
    resolver: zodResolver(petFormSchema),
    defaultValues: {
      name: pet?.name ?? '',
      species: pet?.species ?? 'dog',
      gender: pet?.gender ?? 'unknown',
      breed: pet?.breed ?? '',
      dateOfBirth: pet?.dateOfBirth ?? '',
      color: pet?.color ?? '',
      weightKg: pet?.weightKg != null ? String(pet.weightKg) : '',
      isNeutered: pet?.isNeutered ?? false,
      knownAllergiesText: pet?.knownAllergies?.join('\n') ?? '',
      notes: pet?.notes ?? '',
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function onSubmit(values: PetFormValues) {
    const dto = {
      name: values.name,
      species: values.species,
      gender: values.gender,
      breed: values.breed || undefined,
      dateOfBirth: values.dateOfBirth || undefined,
      color: values.color || undefined,
      weightKg: values.weightKg || undefined,
      isNeutered: values.isNeutered,
      knownAllergies: values.knownAllergiesText
        ? values.knownAllergiesText.split('\n').map((s) => s.trim()).filter(Boolean)
        : [],
      notes: values.notes || undefined,
    };

    let petId: string;

    if (isEditMode && pet) {
      const updated = await updatePet.mutateAsync({ petId: pet.id, dto });
      petId = updated.id;
    } else {
      const created = await createPet.mutateAsync(dto);
      petId = created.id;
    }

    if (avatarFile) {
      try {
        await uploadAvatar.mutateAsync({ petId, file: avatarFile });
      } catch {
        toast({ title: 'Lưu thành công nhưng upload ảnh thất bại. Bạn có thể thêm ảnh sau.', variant: 'destructive' });
      }
    }

    toast({ title: isEditMode ? 'Đã cập nhật thú cưng' : 'Đã thêm thú cưng mới' });
    onClose();
  }

  const isPending = createPet.isPending || updatePet.isPending || uploadAvatar.isPending || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md w-full max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>{isEditMode ? 'Sửa thông tin thú cưng' : 'Thêm thú cưng mới'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1 px-6 pb-6 space-y-4">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-20 w-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:border-gray-400 transition-colors"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl">🐾</span>
              )}
            </button>
            <span className="text-xs text-gray-500">Tap để chọn ảnh</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Section 1: Cơ bản */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Thông tin cơ bản</p>

            <div className="space-y-1">
              <Label htmlFor="name">Tên thú cưng *</Label>
              <Input id="name" {...register('name')} placeholder="vd: Mochi" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Loài *</Label>
                <Controller
                  name="species"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loài" />
                      </SelectTrigger>
                      <SelectContent>
                        {PET_SPECIES_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.species && <p className="text-xs text-red-500">{errors.species.message}</p>}
              </div>

              <div className="space-y-1">
                <Label>Giới tính *</Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn" />
                      </SelectTrigger>
                      <SelectContent>
                        {PET_GENDER_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Bổ sung */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Thông tin bổ sung</p>

            <div className="space-y-1">
              <Label htmlFor="breed">Giống</Label>
              <Input id="breed" {...register('breed')} placeholder="vd: Golden Retriever" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="color">Màu lông</Label>
                <Input id="color" {...register('color')} placeholder="vd: Vàng" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="weightKg">Cân nặng (kg)</Label>
              <Input
                id="weightKg"
                type="number"
                step="0.1"
                min="0"
                {...register('weightKg')}
                placeholder="vd: 3.5"
              />
              {errors.weightKg && <p className="text-xs text-red-500">{errors.weightKg.message}</p>}
            </div>

            <div className="flex items-center gap-2">
              <Controller
                name="isNeutered"
                control={control}
                render={({ field }) => (
                  <input
                    id="isNeutered"
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                )}
              />
              <Label htmlFor="isNeutered" className="font-normal cursor-pointer">Đã triệt sản</Label>
            </div>
          </div>

          {/* Section 3: Y tế */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Thông tin y tế</p>

            <div className="space-y-1">
              <Label htmlFor="knownAllergiesText">Dị ứng đã biết</Label>
              <Textarea
                id="knownAllergiesText"
                {...register('knownAllergiesText')}
                placeholder={'Mỗi dòng một loại dị ứng\nvd: Penicillin'}
                rows={3}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Ghi chú thêm</Label>
              <Textarea id="notes" {...register('notes')} placeholder="Thông tin thêm về thú cưng..." rows={2} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
              Huỷ
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? 'Đang lưu...' : isEditMode ? 'Cập nhật' : 'Thêm thú cưng'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
