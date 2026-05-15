import { createFileRoute, Link } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth.store';
import { useMyPets } from '@/hooks/use-customer-portal';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PET_SPECIES_LABELS, PET_STATUS_LABELS, type PetSpecies, type PetStatus } from '@/types/pet';
import { formatDateTime } from '@/lib/formatDate';
import { cn } from '@/lib/cn';

export const Route = createFileRoute('/customer/_layout/')({
  component: CustomerHomePage,
});

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

const CLINIC_PHONE = '028 3873 0496';

function PetCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-1.5" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </Card>
  );
}

function CustomerHomePage() {
  const user = useAuthStore((s) => s.user);
  const { data: pets, isLoading, isError } = useMyPets();

  const userName = user?.role === 'customer' ? user.name : 'bạn';

  if (isError) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <p className="text-center text-red-600 text-base">Không thể tải dữ liệu. Vui lòng thử lại.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Xin chào, {userName}!</h1>
        <p className="text-base text-gray-500 mt-1">Thú cưng của bạn</p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <PetCardSkeleton />
          <PetCardSkeleton />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && pets && pets.length === 0 && (
        <Card className="p-6 mb-6 text-center">
          <p className="text-4xl mb-3">🐾</p>
          <p className="text-base text-gray-700 font-medium mb-2">Bạn chưa có thú cưng nào.</p>
          <p className="text-sm text-gray-500 mb-4">Liên hệ phòng khám để được thêm thú cưng.</p>
          <a
            href={`tel:${CLINIC_PHONE}`}
            className="text-[var(--color-primary)] font-semibold text-base hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded"
          >
            {CLINIC_PHONE}
          </a>
        </Card>
      )}

      {/* Pet grid */}
      {!isLoading && pets && pets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {pets.map((pet) => (
            <Card key={pet.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {pet.avatarUrl ? (
                    <Avatar src={pet.avatarUrl} name={pet.name} size="lg" />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl shrink-0">
                      {SPECIES_EMOJI[pet.species]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-gray-900 truncate">{pet.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <Badge variant="secondary">{PET_SPECIES_LABELS[pet.species]}</Badge>
                      <Badge variant={STATUS_BADGE_VARIANT[pet.status]}>
                        {PET_STATUS_LABELS[pet.status]}
                      </Badge>
                    </div>
                  </div>
                </div>

                {pet.upcomingAppointment && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-3">
                    <p className="text-xs font-medium text-blue-700">
                      Lịch hẹn sắp tới:{' '}
                      <span className="font-semibold">
                        {formatDateTime(pet.upcomingAppointment.scheduledAt)}
                      </span>
                    </p>
                  </div>
                )}

                <Link to="/customer/pets/$id" params={{ id: pet.id }}>
                  <Button variant="outline" size="default" className="w-full min-h-[44px]">
                    Xem hồ sơ
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <Card className="p-4">
        <p className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Thao tác nhanh</p>
        <div className="flex flex-col gap-3">
          <Link to="/customer/bookings/new">
            <Button size="lg" className={cn('w-full min-h-[52px] text-base')}>
              📅 Đặt lịch khám
            </Button>
          </Link>
          <Link to="/customer/chat">
            <Button variant="outline" size="lg" className="w-full min-h-[52px] text-base">
              🐾 Chat với AI
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
