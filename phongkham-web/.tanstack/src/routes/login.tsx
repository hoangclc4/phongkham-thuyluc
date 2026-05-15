import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute('/login')({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  function onSubmit(values: LoginFormValues) {
    login.mutate(
      { email: values.email, password: values.password },
      {
        onSuccess: () => {
          navigate({ to: '/admin' });
        },
        onError: () => {
          toast({ title: 'Đăng nhập thất bại', description: 'Email hoặc mật khẩu không đúng.', variant: 'destructive' });
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
          <p className="text-sm text-gray-500 mt-1">Đăng nhập dành cho nhân viên</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="bacsi@example.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
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
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Bạn là khách hàng?{' '}
            <Link to="/customer/login" className="text-[var(--color-primary)] hover:underline">
              Đăng nhập tại đây
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
