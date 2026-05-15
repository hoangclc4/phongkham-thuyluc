import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useCreatePet } from '@/hooks/use-pets';
import { useCustomer, useCustomers } from '@/hooks/use-customers';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { PET_SPECIES_LABELS, PET_GENDER_LABELS } from '@/types/pet';
import type { PetSpecies, PetGender } from '@/types/pet';

const newPetSearchSchema = z.object({
  customerId: z.string().optional(),
});

const createPetSchema = z.object({
  customerId: z.string().min(1, 'Vui lòng chọn khách hàng'),
  name: z.string().min(1, 'Tên thú cưng không được để trống'),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'reptile', 'other'] as const),
  breed: z.string().optional(),
  gender: z.enum(['male', 'female', 'unknown'] as const).optional(),
  dateOfBirth: z.string().optional(),
  weightKg: z.number({ invalid_type_error: 'Nhập số hợp lệ' }).positive().optional(),
  color: z.string().optional(),
  isNeutered: z.boolean().optional(),
  notes: z.string().optional(),
});

type CreatePetFormValues = z.infer<typeof createPetSchema>;

export const Route = createFileRoute('/admin/_layout/pets/new')({
  validateSearch: newPetSearchSchema,
  component: NewPetPage,
});

function NewPetPage() {
  const navigate = useNavigate();
  const { customerId } = Route.useSearch();
  const createPet = useCreatePet();

  const { data: prefillCustomer } = useCustomer(customerId ?? '');
  const { data: customersData } = useCustomers({ limit: 100, page: 1 });

  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreatePetFormValues>({
    resolver: zodResolver(createPetSchema),
    defaultValues: {
      customerId: customerId ?? '',
      name: '',
      species: 'dog',
      gender: 'unknown',
      isNeutered: false,
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

  function onSubmit(values: CreatePetFormValues) {
    createPet.mutate(
      {
        customerId: values.customerId,
        name: values.name,
        species: values.species as PetSpecies,
        breed: values.breed || undefined,
        gender: values.gender as PetGender | undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        weightKg: values.weightKg,
        color: values.color || undefined,
        knownAllergies: allergies,
        isNeutered: values.isNeutered,
        notes: values.notes || undefined,
      },
      {
        onSuccess: (newPet) => {
          toast({ title: 'Thêm thú cưng thành công' });
          navigate({ to: '/admin/pets/$id', params: { id: newPet.id } });
        },
        onError: () => {
          toast({
            title: 'Thêm thú cưng thất bại',
            description: 'Vui lòng kiểm tra lại thông tin.',
            variant: 'destructive',
          });
        },
      },
    );
  }

  const breadcrumbBack = customerId
    ? `/admin/customers/${customerId}`
    : '/admin/pets';
  const breadcrumbLabel = customerId ? 'Khách hàng' : 'Thú cưng';

  return (
    <div className="space-y-6 max-w-2xl">
      <nav className="text-sm text-gray-500 flex gap-2">
        <Link to={breadcrumbBack} className="hover:text-gray-700">
          {breadcrumbLabel}
        </Link>
        <span>/</span>
        <span className="text-gray-900">Thêm mới</span>
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>Thêm thú cưng mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="customerId">
                Khách hàng <span className="text-red-500">*</span>
              </Label>
              {customerId && prefillCustomer ? (
                <Input
                  id="customerId"
                  value={prefillCustomer.fullName}
                  disabled
                />
              ) : (
                <Controller
                  name="customerId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="customerId">
                        <SelectValue placeholder="Chọn khách hàng..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customersData?.data.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.fullName} — {c.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {errors.customerId && (
                <p className="text-xs text-red-600">{errors.customerId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">
                Tên thú cưng <span className="text-red-500">*</span>
              </Label>
              <Input id="name" placeholder="Bông, Miu, Lucky..." {...register('name')} />
              {errors.name && (
                <p className="text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="species">
                  Loài <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="species"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="species">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PET_SPECIES_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gender">Giới tính</Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger id="gender">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PET_GENDER_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="breed">Giống</Label>
              <Input id="breed" placeholder="Golden Retriever, Anh lông ngắn..." {...register('breed')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="weightKg">Cân nặng (kg)</Label>
                <Input
                  id="weightKg"
                  type="number"
                  step="0.1"
                  placeholder="3.5"
                  {...register('weightKg', { valueAsNumber: true })}
                />
                {errors.weightKg && (
                  <p className="text-xs text-red-600">{errors.weightKg.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="color">Màu lông</Label>
              <Input id="color" placeholder="Vàng, trắng, đen vàng..." {...register('color')} />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isNeutered"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 accent-[var(--color-primary)]"
                {...register('isNeutered')}
              />
              <Label htmlFor="isNeutered" className="cursor-pointer">
                Đã triệt sản
              </Label>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="allergyInput">Dị ứng</Label>
              <div className="flex gap-2">
                <Input
                  id="allergyInput"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyDown={handleAllergyKeyDown}
                  placeholder="Nhập và nhấn Enter để thêm..."
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
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                placeholder="Ghi chú thêm về thú cưng..."
                {...register('notes')}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={createPet.isPending}>
                {createPet.isPending ? 'Đang lưu...' : 'Lưu'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: customerId ? `/admin/customers/${customerId}` : '/admin/pets' })}
              >
                Huỷ
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
