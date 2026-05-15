import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResetPassword } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';

const resetSchema = z
  .object({
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute('/customer/reset-password')({
  validateSearch: searchSchema,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useSearch({ from: '/customer/reset-password' });
  const resetPassword = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  });

  function onSubmit(values: ResetFormValues) {
    if (!token) {
      toast({ title: 'Liên kết không hợp lệ', variant: 'destructive' });
      return;
    }
    resetPassword.mutate(
      { token, newPassword: values.password },
      {
        onSuccess: () => {
          toast({ title: 'Đặt lại mật khẩu thành công' });
          navigate({ to: '/customer/login' });
        },
        onError: () => {
          toast({ title: 'Liên kết đã hết hạn hoặc không hợp lệ', variant: 'destructive' });
        },
      },
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Đặt lại mật khẩu</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mật khẩu mới</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
              {resetPassword.isPending ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
