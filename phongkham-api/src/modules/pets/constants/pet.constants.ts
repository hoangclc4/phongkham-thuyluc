import {
  petGenderEnum,
  petSpeciesEnum,
  petStatusEnum,
} from '../../../database/schema/pets.schema';

export type PetSpeciesValue = (typeof petSpeciesEnum.enumValues)[number];
export type PetGenderValue = (typeof petGenderEnum.enumValues)[number];
export type PetStatusValue = (typeof petStatusEnum.enumValues)[number];

export const SPECIES_LABELS: Record<PetSpeciesValue, string> = {
  dog: 'Chó',
  cat: 'Mèo',
  bird: 'Chim',
  rabbit: 'Thỏ',
  hamster: 'Hamster',
  reptile: 'Bò sát',
  other: 'Khác',
};

export const GENDER_LABELS: Record<PetGenderValue, string> = {
  male: 'Đực',
  female: 'Cái',
  unknown: 'Không rõ',
};

export const PET_STATUS_LABELS: Record<PetStatusValue, string> = {
  healthy: 'Khỏe mạnh',
  in_treatment: 'Đang điều trị',
  monitoring: 'Đang theo dõi',
  deceased: 'Đã mất',
  transferred: 'Đã chuyển',
};

export const VALID_PET_STATUS_TRANSITIONS: Record<PetStatusValue, PetStatusValue[]> = {
  healthy: ['in_treatment', 'deceased', 'transferred'],
  in_treatment: ['monitoring', 'healthy', 'deceased', 'transferred'],
  monitoring: ['healthy', 'deceased', 'transferred'],
  deceased: [],
  transferred: [],
};

export const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedAvatarMimeType = (typeof ALLOWED_AVATAR_MIME_TYPES)[number];

export const AVATAR_MAX_SIZE_BYTES = 10 * 1024 * 1024;
