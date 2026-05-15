import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateCustomer } from '@/hooks/use-customers';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PHONE_PATTERN = /^0\d{9}$/;
const MIN_NAME_LENGTH = 2;

const createCustomerSchema = z.object({
  phone: z.string().regex(PHONE_PATTERN, 'Số điện thoại phải bắt đầu bằng 0 và gồm 10 chữ số'),
  fullName: z.string().min(MIN_NAME_LENGTH, 'Họ tên tối thiểu 2 ký tự'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  address: z.string().optional(),
  internalNotes: z.string().optional(),
});

type CreateCustomerFormValues = z.infer<typeof createCustomerSchema>;

export const Route = createFileRoute('/admin/_layout/customers/new')({
  component: NewCustomerPage,
});

function NewCustomerPage() {
  const navigate = useNavigate();
  const createCustomer = useCreateCustomer();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      phone: '',
      fullName: '',
      email: '',
      address: '',
      internalNotes: '',
    },
  });

  function onSubmit(values: CreateCustomerFormValues) {
    createCustomer.mutate(
      {
        phone: values.phone,
        fullName: values.fullName,
        email: values.email || undefined,
        address: values.address || undefined,
      },
      {
        onSuccess: (newCustomer) => {
          toast({ title: 'Thêm khách hàng thành công' });
          navigate({ to: '/admin/customers/$id', params: { id: newCustomer.id } });
        },
        onError: () => {
          toast({
            title: 'Thêm khách hàng thất bại',
            description: 'Vui lòng kiểm tra lại thông tin.',
            variant: 'destructive',
          });
        },
      },
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <nav className="text-sm text-gray-500 flex gap-2">
        <Link to="/admin/customers" className="hover:text-gray-700">
          Khách hàng
        </Link>
        <span>/</span>
        <span className="text-gray-900">Thêm mới</span>
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>Thêm khách hàng mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="phone">
                Số điện thoại <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0912345678"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-xs text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fullName">
                Họ và tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="Nguyễn Văn A"
                {...register('fullName')}
              />
              {errors.fullName && (
                <p className="text-xs text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                placeholder="123 Đường ABC, Quận 1, TP.HCM"
                {...register('address')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="internalNotes">Ghi chú nội bộ</Label>
              <Textarea
                id="internalNotes"
                placeholder="Ghi chú dành cho nhân viên..."
                {...register('internalNotes')}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={createCustomer.isPending}>
                {createCustomer.isPending ? 'Đang lưu...' : 'Lưu'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: '/admin/customers' })}
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
