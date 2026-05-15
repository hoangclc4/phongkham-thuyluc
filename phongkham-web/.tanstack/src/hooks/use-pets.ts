import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as petsApi from '@/api/pets.api';
import type { CreatePetDto, UpdatePetDto } from '@/types/pet';

interface PetListParams {
  search?: string;
  page?: number;
  limit?: number;
}

export const petKeys = {
  all: ['pets'] as const,
  lists: () => [...petKeys.all, 'list'] as const,
  list: (params?: PetListParams) => [...petKeys.lists(), params] as const,
  details: () => [...petKeys.all, 'detail'] as const,
  detail: (id: string) => [...petKeys.details(), id] as const,
  medicalRecords: (petId: string) => [...petKeys.all, 'medical-records', petId] as const,
};

export function usePets(params?: PetListParams) {
  return useQuery({
    queryKey: petKeys.list(params),
    queryFn: () => petsApi.list(params),
  });
}

export function usePet(id: string) {
  return useQuery({
    queryKey: petKeys.detail(id),
    queryFn: () => petsApi.get(id),
    enabled: Boolean(id),
  });
}

export function usePetMedicalRecords(petId: string) {
  return useQuery({
    queryKey: petKeys.medicalRecords(petId),
    queryFn: () => petsApi.getMedicalRecords(petId),
    enabled: Boolean(petId),
  });
}

export function useCreatePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePetDto) => petsApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: petKeys.lists() });
    },
  });
}

export function useUpdatePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePetDto }) => petsApi.update(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: petKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: petKeys.lists() });
    },
  });
}
