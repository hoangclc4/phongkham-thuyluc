import { createFileRoute, Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForgotPassword } from '@/hooks/use-auth';

const forgotSchema = z.object({
  phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export const Route = createFileRoute('/customer/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const forgotPassword = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  });

  function onSubmit(values: ForgotFormValues) {
    forgotPassword.mutate(values.phone, {
      onSettled: () => {
        setSubmitted(true);
      },
    });
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-4xl">📬</div>
            <p className="text-sm text-gray-600">
              Nếu số điện thoại tồn tại, chúng tôi sẽ gửi email hướng dẫn đặt lại mật khẩu.
            </p>
            <Link
              to="/customer/login"
              className="inline-block text-sm text-[var(--color-primary)] hover:underline"
            >
              Quay lại đăng nhập
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Quên mật khẩu</CardTitle>
          <p className="text-sm text-gray-500">Nhập số điện thoại để nhận email đặt lại mật khẩu</p>
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
            <Button type="submit" className="w-full" disabled={forgotPassword.isPending}>
              {forgotPassword.isPending ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </Button>
            <p className="text-center">
              <Link
                to="/customer/login"
                className="text-sm text-[var(--color-primary)] hover:underline"
              >
                Quay lại đăng nhập
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
