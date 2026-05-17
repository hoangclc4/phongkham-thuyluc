import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCustomerLogin } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';

const loginSchema = z.object({
  phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute('/customer/login')({
  component: CustomerLoginPage,
});

function CustomerLoginPage() {
  const navigate = useNavigate();
  const login = useCustomerLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '0901234567',
      password: 'khachhang123',
    },
  });

  function onSubmit(values: LoginFormValues) {
    login.mutate(
      { phone: values.phone, password: values.password },
      {
        onSuccess: () => {
          navigate({ to: '/customer' });
        },
        onError: () => {
          toast({ title: 'Đăng nhập thất bại', description: 'Số điện thoại hoặc mật khẩu không đúng.', variant: 'destructive' });
        },
      },
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🐾</div>
          <CardTitle className="text-xl">Phòng Khám Thú Y Bác Sĩ Lục</CardTitle>
          <p className="text-sm text-gray-500 mt-1">Cổng thông tin khách hàng</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0901234567"
                autoComplete="tel"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-xs text-red-600">{errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>
            <div className="text-right">
              <Link
                to="/customer/forgot-password"
                className="text-sm text-[var(--color-primary)] hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
