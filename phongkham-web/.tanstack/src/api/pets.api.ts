import { api } from '@/lib/api';
import type { Pet, CreatePetDto, UpdatePetDto } from '@/types/pet';
import type { MedicalRecord } from '@/types/medical-record';
import type { PaginatedResponse } from '@/types/api';

interface PetListParams {
  search?: string;
  page?: number;
  limit?: number;
}

export async function list(params?: PetListParams): Promise<PaginatedResponse<Pet>> {
  const response = await api.get<PaginatedResponse<Pet>>('/admin/pets', { params });
  return response.data;
}

export async function get(id: string): Promise<Pet> {
  const response = await api.get<Pet>(`/admin/pets/${id}`);
  return response.data;
}

export async function create(dto: CreatePetDto): Promise<Pet> {
  const response = await api.post<Pet>('/admin/pets', dto);
  return response.data;
}

export async function update(id: string, dto: UpdatePetDto): Promise<Pet> {
  const response = await api.put<Pet>(`/admin/pets/${id}`, dto);
  return response.data;
}

export async function getMedicalRecords(petId: string): Promise<MedicalRecord[]> {
  const response = await api.get<MedicalRecord[]>(`/admin/pets/${petId}/medical-records`);
  return response.data;
}
