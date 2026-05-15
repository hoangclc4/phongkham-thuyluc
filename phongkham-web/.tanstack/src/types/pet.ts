export type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'reptile' | 'other';
export type PetStatus = 'healthy' | 'in_treatment' | 'monitoring' | 'deceased' | 'transferred';
export type PetGender = 'male' | 'female' | 'unknown';

export const PET_SPECIES_LABELS: Record<PetSpecies, string> = {
  dog: 'Chó',
  cat: 'Mèo',
  bird: 'Chim',
  rabbit: 'Thỏ',
  hamster: 'Hamster',
  reptile: 'Bò sát',
  other: 'Khác',
};

export const PET_STATUS_LABELS: Record<PetStatus, string> = {
  healthy: 'Khoẻ mạnh',
  in_treatment: 'Đang điều trị',
  monitoring: 'Đang theo dõi',
  deceased: 'Đã mất',
  transferred: 'Đã chuyển',
};

export const PET_GENDER_LABELS: Record<PetGender, string> = {
  male: 'Đực',
  female: 'Cái',
  unknown: 'Không rõ',
};

export interface UpcomingAppointment {
  id: string;
  displayNumber: string;
  scheduledAt: string;
}

export interface Pet {
  id: string;
  customerId: string;
  ownerPhone: string;
  ownerName: string;
  name: string;
  species: PetSpecies;
  speciesLabel: string;
  breed: string | null;
  gender: PetGender;
  genderLabel: string;
  dateOfBirth: string | null;
  ageDisplay: string | null;
  weightKg: number | null;
  color: string | null;
  avatarUrl: string | null;
  status: PetStatus;
  statusLabel: string;
  knownAllergies: string[];
  isNeutered: boolean;
  microchipId: string | null;
  notes: string | null;
  lastVisitDate: string | null;
  upcomingAppointment: UpcomingAppointment | null;
}

export interface CreatePetDto {
  customerId: string;
  name: string;
  species: PetSpecies;
  breed?: string;
  gender?: PetGender;
  dateOfBirth?: string;
  weightKg?: number;
  color?: string;
  knownAllergies?: string[];
  isNeutered?: boolean;
  notes?: string;
}

export interface UpdatePetDto {
  name?: string;
  species?: PetSpecies;
  breed?: string;
  gender?: PetGender;
  dateOfBirth?: string;
  weightKg?: number;
  color?: string;
  status?: PetStatus;
  knownAllergies?: string[];
  isNeutered?: boolean;
  notes?: string;
}
