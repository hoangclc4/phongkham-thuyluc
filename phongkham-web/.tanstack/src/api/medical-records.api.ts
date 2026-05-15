import { api } from '@/lib/api';
import type {
  MedicalRecord,
  MedicalRecordListParams,
  CreateMedicalRecordDto,
  Attachment,
} from '@/types/medical-record';
import type { PaginatedResponse } from '@/types/api';

export async function list(params: MedicalRecordListParams): Promise<PaginatedResponse<MedicalRecord>> {
  const response = await api.get<PaginatedResponse<MedicalRecord>>('/admin/medical-records', { params });
  return response.data;
}

export async function get(id: string): Promise<MedicalRecord> {
  const response = await api.get<MedicalRecord>(`/admin/medical-records/${id}`);
  return response.data;
}

export async function create(dto: CreateMedicalRecordDto): Promise<MedicalRecord> {
  const response = await api.post<MedicalRecord>('/admin/medical-records', dto);
  return response.data;
}

export async function update(id: string, dto: Partial<CreateMedicalRecordDto>): Promise<MedicalRecord> {
  const response = await api.put<MedicalRecord>(`/admin/medical-records/${id}`, dto);
  return response.data;
}

export async function updateSharing(id: string, isShared: boolean): Promise<MedicalRecord> {
  const response = await api.patch<MedicalRecord>(`/admin/medical-records/${id}/sharing`, { isShared });
  return response.data;
}

export async function uploadAttachment(id: string, file: File): Promise<Attachment> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<Attachment>(`/admin/medical-records/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function deleteAttachment(id: string, attachmentId: string): Promise<void> {
  await api.delete(`/admin/medical-records/${id}/attachments/${attachmentId}`);
}
