import { createFileRoute, Link } from '@tanstack/react-router';
import { useMyPets } from '@/hooks/use-customer-portal';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
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

  if (isError) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <p className="text-center text-red-600">Không thể tải danh sách thú cưng. Vui lòng thử lại.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Thú cưng của tôi</h1>

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
          <p className="text-sm text-gray-500 mt-1">Liên hệ phòng khám để được thêm thú cưng.</p>
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
    </div>
  );
}
