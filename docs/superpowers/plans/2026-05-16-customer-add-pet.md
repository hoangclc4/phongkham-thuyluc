# Customer Add/Edit/Delete Pet — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép khách hàng tự thêm, sửa, xoá thú cưng của họ ngay trong customer portal, thú cưng active ngay (không cần admin duyệt).

**Architecture:** Thêm 4 endpoint mới vào `CustomerController` (`POST/PUT/DELETE /customer/pets/:petId` + `PUT /customer/pets/:petId/avatar`). Frontend dùng Modal/Dialog dùng chung cho create và edit, `DeletePetConfirmDialog` riêng cho xoá. Avatar được upload sau khi create/update thành công.

**Tech Stack:** NestJS + Drizzle ORM (backend), React 19 + TanStack Query v5 + react-hook-form + zod + shadcn/ui Dialog (frontend).

**Spec:** `docs/superpowers/specs/2026-05-16-customer-add-pet-design.md`

---

## File Map

### Backend (tạo mới)
- `backend/src/modules/customer/dto/create-customer-pet.dto.ts`
- `backend/src/modules/customer/dto/update-customer-pet.dto.ts`

### Backend (sửa)
- `backend/src/modules/customer/customer.service.ts` — thêm `createPet`, `updatePet`, `deletePet`, `updatePetAvatar`
- `backend/src/modules/customer/customer.controller.ts` — inject `StorageService`, thêm 4 endpoint

### Frontend (tạo mới)
- `frontend/.tanstack/src/components/customer/pet-form-modal.tsx`
- `frontend/.tanstack/src/components/customer/delete-pet-confirm-dialog.tsx`

### Frontend (sửa)
- `frontend/.tanstack/src/api/customer.api.ts` — thêm `createPet`, `updatePet`, `deletePet`, `uploadPetAvatar`
- `frontend/.tanstack/src/hooks/use-customer-portal.ts` — thêm 4 mutation hooks
- `frontend/.tanstack/src/routes/customer/_layout/pets/index.tsx` — thêm nút "+ Thêm"
- `frontend/.tanstack/src/routes/customer/_layout/pets/$id.tsx` — thêm nút "Sửa" + "Xoá"

---

## Task 1: Backend — CreateCustomerPetDto

**Files:**
- Create: `backend/src/modules/customer/dto/create-customer-pet.dto.ts`

- [ ] **Tạo file DTO**

```typescript
// backend/src/modules/customer/dto/create-customer-pet.dto.ts
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { petGenderEnum, petSpeciesEnum } from '../../../database/schema/pets.schema';

export class CreateCustomerPetDto {
  @IsString()
  @Length(1, 50)
  declare name: string;

  @IsEnum(petSpeciesEnum.enumValues)
  declare species: string;

  @IsEnum(petGenderEnum.enumValues)
  declare gender: string;

  @IsString()
  @IsOptional()
  breed?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsNumberString()
  @IsOptional()
  weightKg?: string;

  @IsBoolean()
  @IsOptional()
  isNeutered?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  knownAllergies?: string[];

  @IsString()
  @IsOptional()
  notes?: string;
}
```

- [ ] **Tạo UpdateCustomerPetDto** (cùng file hoặc file riêng)

```typescript
// backend/src/modules/customer/dto/update-customer-pet.dto.ts
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { petGenderEnum, petSpeciesEnum } from '../../../database/schema/pets.schema';

export class UpdateCustomerPetDto {
  @IsString()
  @Length(1, 50)
  @IsOptional()
  name?: string;

  @IsEnum(petSpeciesEnum.enumValues)
  @IsOptional()
  species?: string;

  @IsEnum(petGenderEnum.enumValues)
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  breed?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsNumberString()
  @IsOptional()
  weightKg?: string;

  @IsBoolean()
  @IsOptional()
  isNeutered?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  knownAllergies?: string[];

  @IsString()
  @IsOptional()
  notes?: string;
}
```

- [ ] **Commit**

```bash
git add backend/src/modules/customer/dto/create-customer-pet.dto.ts backend/src/modules/customer/dto/update-customer-pet.dto.ts
git commit -m "feat(customer): add CreateCustomerPetDto and UpdateCustomerPetDto"
```

---

## Task 2: Backend — CustomerService pet methods

**Files:**
- Modify: `backend/src/modules/customer/customer.service.ts`

- [ ] **Thêm imports** ở đầu file (sau các import hiện có)

```typescript
import { CreateCustomerPetDto } from './dto/create-customer-pet.dto';
import { UpdateCustomerPetDto } from './dto/update-customer-pet.dto';
```

- [ ] **Thêm method `createPet`** vào class `CustomerService` (sau method `changePassword`)

```typescript
async createPet(customerId: string, dto: CreateCustomerPetDto): Promise<CustomerPetResponse> {
  const [inserted] = await this.db
    .insert(pets)
    .values({
      customerId,
      name: dto.name,
      species: dto.species as typeof pets.$inferInsert['species'],
      gender: (dto.gender ?? 'unknown') as typeof pets.$inferInsert['gender'],
      breed: dto.breed ?? null,
      dateOfBirth: dto.dateOfBirth ?? null,
      color: dto.color ?? null,
      weightKg: dto.weightKg ?? null,
      isNeutered: dto.isNeutered ?? false,
      knownAllergies: dto.knownAllergies ?? [],
      notes: dto.notes ?? null,
      status: 'healthy',
    })
    .returning({ id: pets.id });

  return this.getPet(customerId, inserted.id);
}
```

- [ ] **Thêm method `updatePet`**

```typescript
async updatePet(customerId: string, petId: string, dto: UpdateCustomerPetDto): Promise<CustomerPetResponse> {
  await this.verifyPetOwnership(customerId, petId);

  const updateData: Partial<typeof pets.$inferInsert> = { updatedAt: new Date() };

  if (dto.name !== undefined) updateData.name = dto.name;
  if (dto.species !== undefined) updateData.species = dto.species as typeof pets.$inferInsert['species'];
  if (dto.gender !== undefined) updateData.gender = dto.gender as typeof pets.$inferInsert['gender'];
  if (dto.breed !== undefined) updateData.breed = dto.breed;
  if (dto.dateOfBirth !== undefined) updateData.dateOfBirth = dto.dateOfBirth;
  if (dto.color !== undefined) updateData.color = dto.color;
  if (dto.weightKg !== undefined) updateData.weightKg = dto.weightKg;
  if (dto.isNeutered !== undefined) updateData.isNeutered = dto.isNeutered;
  if (dto.knownAllergies !== undefined) updateData.knownAllergies = dto.knownAllergies;
  if (dto.notes !== undefined) updateData.notes = dto.notes;

  await this.db.update(pets).set(updateData).where(eq(pets.id, petId));

  return this.getPet(customerId, petId);
}
```

- [ ] **Thêm method `deletePet`**

```typescript
async deletePet(customerId: string, petId: string): Promise<void> {
  await this.verifyPetOwnership(customerId, petId);
  await this.db
    .update(pets)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(pets.id, petId));
}
```

- [ ] **Thêm method `updatePetAvatar`**

```typescript
async updatePetAvatar(customerId: string, petId: string, avatarUrl: string): Promise<CustomerPetResponse> {
  await this.verifyPetOwnership(customerId, petId);
  await this.db
    .update(pets)
    .set({ avatarUrl, updatedAt: new Date() })
    .where(eq(pets.id, petId));
  return this.getPet(customerId, petId);
}
```

- [ ] **Commit**

```bash
git add backend/src/modules/customer/customer.service.ts
git commit -m "feat(customer): add createPet, updatePet, deletePet, updatePetAvatar service methods"
```

---

## Task 3: Backend — CustomerController endpoints

**Files:**
- Modify: `backend/src/modules/customer/customer.controller.ts`

- [ ] **Thêm imports** ở đầu file

```typescript
import { FastifyRequest } from 'fastify';
import { Req } from '@nestjs/common';  // Req đã có thể có trong imports hiện tại, kiểm tra trước
import { StorageService } from '../../common/services/storage.service';
import { CreateCustomerPetDto } from './dto/create-customer-pet.dto';
import { UpdateCustomerPetDto } from './dto/update-customer-pet.dto';
import {
  ALLOWED_AVATAR_MIME_TYPES,
  type AllowedAvatarMimeType,
  AVATAR_MAX_SIZE_BYTES,
} from '../pets/constants/pet.constants';
```

Kiểm tra `Req` đã có trong `@nestjs/common` import chưa — nếu rồi thì không import thêm.

- [ ] **Inject `StorageService`** vào constructor

Thay constructor hiện tại:
```typescript
constructor(
  private readonly customerService: CustomerService,
  private readonly bookingsService: BookingsService,
) {}
```

Thành:
```typescript
constructor(
  private readonly customerService: CustomerService,
  private readonly bookingsService: BookingsService,
  private readonly storageService: StorageService,
) {}
```

- [ ] **Thêm 4 endpoints** vào controller (sau endpoint `GET pets/:petId` hiện có)

```typescript
@Post('pets')
@HttpCode(HttpStatus.CREATED)
createPet(@GetUser() user: CustomerJwtPayload, @Body() dto: CreateCustomerPetDto) {
  return this.customerService.createPet(user.sub, dto);
}

@Put('pets/:petId')
updatePet(
  @GetUser() user: CustomerJwtPayload,
  @Param('petId') petId: string,
  @Body() dto: UpdateCustomerPetDto,
) {
  return this.customerService.updatePet(user.sub, petId, dto);
}

@Delete('pets/:petId')
@HttpCode(HttpStatus.NO_CONTENT)
deletePet(@GetUser() user: CustomerJwtPayload, @Param('petId') petId: string) {
  return this.customerService.deletePet(user.sub, petId);
}

@Put('pets/:petId/avatar')
async uploadPetAvatar(
  @GetUser() user: CustomerJwtPayload,
  @Param('petId') petId: string,
  @Req() req: FastifyRequest,
) {
  const data = await req.file();

  if (!data) {
    throw new BadRequestException('Không có file ảnh');
  }

  if (!ALLOWED_AVATAR_MIME_TYPES.includes(data.mimetype as AllowedAvatarMimeType)) {
    throw new BadRequestException('Chỉ chấp nhận file JPEG, PNG hoặc WebP');
  }

  const buffer = await data.toBuffer();

  if (buffer.length > AVATAR_MAX_SIZE_BYTES) {
    throw new BadRequestException('Kích thước file tối đa 10MB');
  }

  const ext = data.mimetype.split('/')[1];
  const avatarUrl = await this.storageService.uploadFile('pets', petId, buffer, data.mimetype, ext);

  return this.customerService.updatePetAvatar(user.sub, petId, avatarUrl);
}
```

- [ ] **Kiểm tra `BadRequestException`** đã có trong imports `@nestjs/common` chưa — nếu chưa thêm vào.

- [ ] **Commit**

```bash
git add backend/src/modules/customer/customer.controller.ts
git commit -m "feat(customer): add POST/PUT/DELETE pets endpoints and avatar upload"
```

---

## Task 4: Frontend — API functions

**Files:**
- Modify: `frontend/.tanstack/src/api/customer.api.ts`

- [ ] **Thêm types và functions** vào cuối file `customer.api.ts`

```typescript
// Thêm vào đầu file (trong phần imports type):
import type { PetGender, PetSpecies } from '@/types/pet';

// Thêm interfaces:
export interface CreateCustomerPetBody {
  name: string;
  species: PetSpecies;
  gender: PetGender;
  breed?: string;
  dateOfBirth?: string;
  color?: string;
  weightKg?: string;
  isNeutered?: boolean;
  knownAllergies?: string[];
  notes?: string;
}

export type UpdateCustomerPetBody = Partial<CreateCustomerPetBody>;

// Thêm functions:
export async function createPet(dto: CreateCustomerPetBody): Promise<Pet> {
  const response = await api.post<Pet>('/customer/pets', dto);
  return response.data;
}

export async function updatePet(petId: string, dto: UpdateCustomerPetBody): Promise<Pet> {
  const response = await api.put<Pet>(`/customer/pets/${petId}`, dto);
  return response.data;
}

export async function deletePet(petId: string): Promise<void> {
  await api.delete(`/customer/pets/${petId}`);
}

export async function uploadPetAvatar(petId: string, file: File): Promise<Pet> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.put<Pet>(`/customer/pets/${petId}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
```

- [ ] **Commit**

```bash
git add frontend/.tanstack/src/api/customer.api.ts
git commit -m "feat(customer): add createPet, updatePet, deletePet, uploadPetAvatar API functions"
```

---

## Task 5: Frontend — Mutation hooks

**Files:**
- Modify: `frontend/.tanstack/src/hooks/use-customer-portal.ts`

- [ ] **Thêm imports** ở đầu file

```typescript
import type { CreateCustomerPetBody, UpdateCustomerPetBody } from '@/api/customer.api';
```

- [ ] **Thêm 4 hooks** vào cuối file (sau `useChatMutation`)

```typescript
export function useCreateMyPet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCustomerPetBody) => customerApi.createPet(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portalKeys.pets() });
    },
  });
}

export function useUpdateMyPet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ petId, dto }: { petId: string; dto: UpdateCustomerPetBody }) =>
      customerApi.updatePet(petId, dto),
    onSuccess: (_, { petId }) => {
      queryClient.invalidateQueries({ queryKey: portalKeys.pets() });
      queryClient.invalidateQueries({ queryKey: portalKeys.pet(petId) });
    },
  });
}

export function useDeleteMyPet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (petId: string) => customerApi.deletePet(petId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portalKeys.pets() });
    },
  });
}

export function useUploadMyPetAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ petId, file }: { petId: string; file: File }) =>
      customerApi.uploadPetAvatar(petId, file),
    onSuccess: (_, { petId }) => {
      queryClient.invalidateQueries({ queryKey: portalKeys.pets() });
      queryClient.invalidateQueries({ queryKey: portalKeys.pet(petId) });
    },
  });
}
```

- [ ] **Commit**

```bash
git add frontend/.tanstack/src/hooks/use-customer-portal.ts
git commit -m "feat(customer): add useCreateMyPet, useUpdateMyPet, useDeleteMyPet, useUploadMyPetAvatar hooks"
```

---

## Task 6: Frontend — PetFormModal component

**Files:**
- Create: `frontend/.tanstack/src/components/customer/pet-form-modal.tsx`

- [ ] **Tạo file component**

```typescript
// frontend/.tanstack/src/components/customer/pet-form-modal.tsx
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
```

- [ ] **Commit**

```bash
git add frontend/.tanstack/src/components/customer/pet-form-modal.tsx
git commit -m "feat(customer): add PetFormModal component for create/edit pet"
```

---

## Task 7: Frontend — DeletePetConfirmDialog component

**Files:**
- Create: `frontend/.tanstack/src/components/customer/delete-pet-confirm-dialog.tsx`

- [ ] **Tạo file component**

```typescript
// frontend/.tanstack/src/components/customer/delete-pet-confirm-dialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useDeleteMyPet } from '@/hooks/use-customer-portal';

interface DeletePetConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  petId: string;
  petName: string;
  onDeleted: () => void;
}

export function DeletePetConfirmDialog({
  open,
  onClose,
  petId,
  petName,
  onDeleted,
}: DeletePetConfirmDialogProps) {
  const { toast } = useToast();
  const deletePet = useDeleteMyPet();

  async function handleDelete() {
    await deletePet.mutateAsync(petId);
    toast({ title: `Đã xoá ${petName}` });
    onDeleted();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Xoá thú cưng</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">
          Bạn có chắc muốn xoá <strong>{petName}</strong>? Hành động này không thể hoàn tác.
        </p>
        <div className="flex gap-3 mt-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={deletePet.isPending}>
            Huỷ
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleDelete}
            disabled={deletePet.isPending}
          >
            {deletePet.isPending ? 'Đang xoá...' : 'Xoá'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Kiểm tra `Button` có `variant="destructive"` không** — xem `frontend/.tanstack/src/components/ui/button.tsx`. Nếu không có variant `destructive`, dùng `className="bg-red-600 hover:bg-red-700 text-white"` thay thế.

- [ ] **Commit**

```bash
git add frontend/.tanstack/src/components/customer/delete-pet-confirm-dialog.tsx
git commit -m "feat(customer): add DeletePetConfirmDialog component"
```

---

## Task 8: Frontend — Cập nhật trang danh sách /customer/pets

**Files:**
- Modify: `frontend/.tanstack/src/routes/customer/_layout/pets/index.tsx`

- [ ] **Thay thế toàn bộ nội dung file** bằng version có nút "+ Thêm thú cưng"

```typescript
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useMyPets } from '@/hooks/use-customer-portal';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { PetFormModal } from '@/components/customer/pet-form-modal';
import { PET_SPECIES_LABELS, PET_STATUS_LABELS, type PetSpecies, type PetStatus } from '@/types/pet';

const SPECIES_EMOJI: Record<PetSpecies, string> = {
  dog: '🐕',
  cat: '🐈',
  bird: '🐦',
  rabbit: '🐇',
  hamster: '🐹',
  reptile: '🦎',
  other: '🐾',
};

const STATUS_BADGE_VARIANT: Record<PetStatus, 'default' | 'pending' | 'destructive' | 'completed' | 'secondary'> = {
  healthy: 'default',
  in_treatment: 'pending',
  monitoring: 'pending',
  deceased: 'completed',
  transferred: 'secondary',
};

export const Route = createFileRoute('/customer/_layout/pets/')({
  component: CustomerPetsPage,
});

function CustomerPetsPage() {
  const { data: pets, isLoading, isError } = useMyPets();
  const [addModalOpen, setAddModalOpen] = useState(false);

  if (isError) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <p className="text-center text-red-600">Không thể tải danh sách thú cưng. Vui lòng thử lại.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Thú cưng của tôi</h1>
        <Button size="sm" onClick={() => setAddModalOpen(true)} className="min-h-[44px]">
          + Thêm
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-1.5" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && pets?.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-4xl mb-3">🐾</p>
          <p className="text-base text-gray-700 font-medium">Bạn chưa có thú cưng nào.</p>
          <Button className="mt-3" onClick={() => setAddModalOpen(true)}>
            + Thêm thú cưng đầu tiên
          </Button>
        </Card>
      )}

      {!isLoading && pets && pets.length > 0 && (
        <div className="space-y-3">
          {pets.map((pet) => (
            <Card key={pet.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {pet.avatarUrl ? (
                    <Avatar src={pet.avatarUrl} name={pet.name} size="lg" />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl shrink-0">
                      {SPECIES_EMOJI[pet.species]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-900 truncate">{pet.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <Badge variant="secondary">{PET_SPECIES_LABELS[pet.species]}</Badge>
                      <Badge variant={STATUS_BADGE_VARIANT[pet.status]}>
                        {PET_STATUS_LABELS[pet.status]}
                      </Badge>
                    </div>
                    {pet.breed && (
                      <p className="text-xs text-gray-500 mt-1">{pet.breed}</p>
                    )}
                  </div>
                  <Link to="/customer/pets/$id" params={{ id: pet.id }}>
                    <Button variant="outline" size="sm" className="shrink-0 min-h-[44px]">
                      Xem
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PetFormModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add frontend/.tanstack/src/routes/customer/_layout/pets/index.tsx
git commit -m "feat(customer): add '+ Thêm thú cưng' button to pets list page"
```

---

## Task 9: Frontend — Cập nhật trang detail /customer/pets/$id

**Files:**
- Modify: `frontend/.tanstack/src/routes/customer/_layout/pets/$id.tsx`

- [ ] **Thêm imports** ở đầu file

```typescript
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { PetFormModal } from '@/components/customer/pet-form-modal';
import { DeletePetConfirmDialog } from '@/components/customer/delete-pet-confirm-dialog';
```

- [ ] **Thêm state và navigate** vào đầu function `CustomerPetDetailPage`

```typescript
const navigate = useNavigate();
const [editModalOpen, setEditModalOpen] = useState(false);
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
```

- [ ] **Thêm nút Sửa và Xoá** vào sau Link back `← Thú cưng` (dòng 68-73 trong file gốc), thêm row nút bên dưới link back

Tìm đoạn:
```tsx
<Link
  to="/customer/pets"
  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 -ml-1"
>
  <ChevronLeft className="h-4 w-4" />
  Thú cưng
</Link>
```

Thay thành:
```tsx
<div className="flex items-center justify-between">
  <Link
    to="/customer/pets"
    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 -ml-1"
  >
    <ChevronLeft className="h-4 w-4" />
    Thú cưng
  </Link>
  <div className="flex gap-2">
    <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
      Sửa
    </Button>
    <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(true)} className="text-red-600 border-red-200 hover:bg-red-50">
      Xoá
    </Button>
  </div>
</div>
```

- [ ] **Thêm Modal và Dialog** vào cuối return, trước đóng `</div>` ngoài cùng

```tsx
<PetFormModal
  open={editModalOpen}
  onClose={() => setEditModalOpen(false)}
  pet={pet}
/>

<DeletePetConfirmDialog
  open={deleteDialogOpen}
  onClose={() => setDeleteDialogOpen(false)}
  petId={id}
  petName={pet.name}
  onDeleted={() => navigate({ to: '/customer/pets' })}
/>
```

- [ ] **Commit**

```bash
git add frontend/.tanstack/src/routes/customer/_layout/pets/$id.tsx
git commit -m "feat(customer): add edit and delete actions to pet detail page"
```

---

## Self-review checklist

- [x] POST /customer/pets → Task 2 + 3
- [x] PUT /customer/pets/:petId → Task 2 + 3
- [x] DELETE /customer/pets/:petId → Task 2 + 3
- [x] PUT /customer/pets/:petId/avatar → Task 2 + 3
- [x] DTOs: name/species/gender required, microchipId excluded → Task 1
- [x] Status mặc định `healthy`, không trong DTO → Task 2
- [x] Ownership verify trên mọi endpoint → Task 2 (`verifyPetOwnership`)
- [x] Avatar upload graceful degradation → Task 6 (try/catch sau create/update)
- [x] knownAllergies textarea split `\n` → Task 6
- [x] Empty state thay text → nút thêm → Task 8
- [x] Navigate về `/customer/pets` sau xoá → Task 7 + 9
