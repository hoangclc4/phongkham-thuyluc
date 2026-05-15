import { createFileRoute } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMyProfile, portalKeys } from '@/hooks/use-customer-portal';
import * as customerApi from '@/api/customer.api';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';

const updateProfileSchema = z.object({
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof updateProfileSchema>;

export const Route = createFileRoute('/customer/_layout/profile/')({
  component: CustomerProfilePage,
});

function CustomerProfilePage() {
  const { data: profile, isLoading, isError } = useMyProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const logout = useLogout();
  const user = useAuthStore((s) => s.user);

  const updateProfile = useMutation({
    mutationFn: (dto: { email?: string; address?: string }) => customerApi.updateProfile(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portalKeys.profile() });
      toast({ title: 'Cập nhật thành công' });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(updateProfileSchema),
    values: {
      email: profile?.email ?? '',
      address: profile?.address ?? '',
    },
  });

  const userName = user?.role === 'customer' ? user.name : '';

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <Alert variant="destructive">
          <AlertDescription>Không thể tải thông tin hồ sơ. Vui lòng thử lại.</AlertDescription>
        </Alert>
      </div>
    );
  }

  async function onSubmit(values: FormValues) {
    await updateProfile.mutateAsync({
      email: values.email || undefined,
      address: values.address || undefined,
    });
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Hồ sơ của tôi</h1>

      {/* Avatar + name */}
      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xl font-bold shrink-0">
            {(userName || profile.fullName).charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{profile.fullName}</p>
            <p className="text-sm text-gray-500">{profile.phone}</p>
          </div>
        </CardContent>
      </Card>

      {updateProfile.isError && (
        <Alert variant="destructive">
          <AlertDescription>Không thể cập nhật. Vui lòng thử lại.</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <Label htmlFor="profile-phone">Số điện thoại</Label>
              <Input
                id="profile-phone"
                value={profile.phone}
                disabled
                className="mt-1 bg-gray-50 text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-400">Số điện thoại không thể thay đổi.</p>
            </div>

            <div>
              <Label htmlFor="profile-name">Họ và tên</Label>
              <Input
                id="profile-name"
                value={profile.fullName}
                disabled
                className="mt-1 bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                {...register('email')}
                placeholder="email@example.com"
                className="mt-1"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="profile-address">Địa chỉ</Label>
              <Input
                id="profile-address"
                {...register('address')}
                placeholder="Địa chỉ của bạn..."
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full min-h-[52px]"
              disabled={!isDirty || updateProfile.isPending}
            >
              {updateProfile.isPending ? (
                <>
                  <Spinner size="sm" /> Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </Button>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardContent className="p-5">
          <button
            onClick={() => logout.mutate()}
            className="w-full text-left text-sm text-red-600 hover:text-red-700 font-medium py-1"
          >
            Đăng xuất
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
