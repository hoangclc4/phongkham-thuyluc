import { createFileRoute, Link } from '@tanstack/react-router';
import { useMyPet, useMyMedicalRecords } from '@/hooks/use-customer-portal';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  PET_SPECIES_LABELS,
  PET_STATUS_LABELS,
  PET_GENDER_LABELS,
  type PetSpecies,
  type PetStatus,
} from '@/types/pet';
import { formatDate } from '@/lib/formatDate';
import { ChevronLeft } from 'lucide-react';

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

export const Route = createFileRoute('/customer/_layout/pets/$id')({
  component: CustomerPetDetailPage,
});

function CustomerPetDetailPage() {
  const { id } = Route.useParams();
  const { data: pet, isLoading: petLoading, isError: petError } = useMyPet(id);
  const { data: records, isLoading: recordsLoading } = useMyMedicalRecords(id);

  if (petLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (petError || !pet) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <Alert variant="destructive">
          <AlertDescription>Không tìm thấy thông tin thú cưng.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const sharedRecords = records?.filter((r) => r.isSharedWithCustomer) ?? [];

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <Link
        to="/customer/pets"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 -ml-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Thú cưng
      </Link>

      {/* Pet info */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4 mb-4">
            {pet.avatarUrl ? (
              <Avatar src={pet.avatarUrl} name={pet.name} size="lg" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-3xl shrink-0">
                {SPECIES_EMOJI[pet.species]}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{pet.name}</h1>
              <div className="flex gap-1.5 mt-1 flex-wrap">
                <Badge variant="secondary">{PET_SPECIES_LABELS[pet.species]}</Badge>
                <Badge variant={STATUS_BADGE_VARIANT[pet.status]}>
                  {PET_STATUS_LABELS[pet.status]}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {pet.breed && (
              <>
                <span className="text-gray-500">Giống</span>
                <span className="font-medium">{pet.breed}</span>
              </>
            )}
            <span className="text-gray-500">Giới tính</span>
            <span className="font-medium">{PET_GENDER_LABELS[pet.gender]}</span>
            {pet.dateOfBirth && (
              <>
                <span className="text-gray-500">Ngày sinh</span>
                <span className="font-medium">{formatDate(pet.dateOfBirth)}</span>
              </>
            )}
            {pet.ageDisplay && (
              <>
                <span className="text-gray-500">Tuổi</span>
                <span className="font-medium">{pet.ageDisplay}</span>
              </>
            )}
            {pet.weightKg !== null && (
              <>
                <span className="text-gray-500">Cân nặng</span>
                <span className="font-medium">{pet.weightKg} kg</span>
              </>
            )}
            {pet.color && (
              <>
                <span className="text-gray-500">Màu sắc</span>
                <span className="font-medium">{pet.color}</span>
              </>
            )}
            <span className="text-gray-500">Triệt sản</span>
            <span className="font-medium">{pet.isNeutered ? 'Có' : 'Chưa'}</span>
            {pet.lastVisitDate && (
              <>
                <span className="text-gray-500">Lần khám cuối</span>
                <span className="font-medium">{formatDate(pet.lastVisitDate)}</span>
              </>
            )}
          </div>

          {pet.knownAllergies.length > 0 && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-700 mb-1">⚠️ Dị ứng đã biết</p>
              <div className="flex flex-wrap gap-1">
                {pet.knownAllergies.map((allergy) => (
                  <Badge key={allergy} className="bg-amber-100 text-amber-800 text-xs">
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {pet.upcomingAppointment && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs font-semibold text-blue-700">
                Lịch hẹn sắp tới: {formatDate(pet.upcomingAppointment.scheduledAt)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking shortcut */}
      <Link to="/customer/bookings/new">
        <Button size="lg" className="w-full min-h-[52px] text-base">
          📅 Đặt lịch khám
        </Button>
      </Link>

      {/* Medical records */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Lịch sử khám</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recordsLoading && (
            <div className="flex justify-center py-6">
              <Spinner size="md" />
            </div>
          )}

          {!recordsLoading && sharedRecords.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-gray-500">
              Chưa có hồ sơ bệnh lý nào được chia sẻ.
            </p>
          )}

          {!recordsLoading && sharedRecords.length > 0 && (
            <div className="divide-y divide-gray-100">
              {sharedRecords.map((record) => (
                <div key={record.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono font-medium text-gray-700">
                        {record.displayNumber}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDate(record.visitDate)}
                      </p>
                      <p className="text-sm text-gray-900 mt-1 font-medium truncate">
                        {record.chiefComplaint}
                      </p>
                      <p className="text-sm text-gray-700 mt-0.5 line-clamp-2">
                        {record.diagnosis}
                      </p>
                    </div>
                    {record.requiresAttention && (
                      <Badge className="bg-red-100 text-red-700 shrink-0 text-xs">
                        Cần chú ý
                      </Badge>
                    )}
                  </div>
                  {record.followupDate && (
                    <p className="text-xs text-amber-600 mt-2">
                      Tái khám: {formatDate(record.followupDate)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
