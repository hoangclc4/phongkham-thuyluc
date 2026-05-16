import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as medicalRecordsApi from '@/api/medical-records.api';
import type { MedicalRecordListParams, CreateMedicalRecordDto } from '@/types/medical-record';

export const medicalRecordKeys = {
  all: ['medical-records'] as const,
  lists: () => [...medicalRecordKeys.all, 'list'] as const,
  list: (params: MedicalRecordListParams) => [...medicalRecordKeys.lists(), params] as const,
  details: () => [...medicalRecordKeys.all, 'detail'] as const,
  detail: (id: string) => [...medicalRecordKeys.details(), id] as const,
};

export function useMedicalRecords(params: MedicalRecordListParams) {
  return useQuery({
    queryKey: medicalRecordKeys.list(params),
    queryFn: () => medicalRecordsApi.list(params),
  });
}

export function useMedicalRecord(id: string) {
  return useQuery({
    queryKey: medicalRecordKeys.detail(id),
    queryFn: () => medicalRecordsApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateMedicalRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMedicalRecordDto) => medicalRecordsApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicalRecordKeys.lists() });
    },
  });
}

export function useUpdateMedicalRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateMedicalRecordDto> }) =>
      medicalRecordsApi.update(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: medicalRecordKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: medicalRecordKeys.lists() });
    },
  });
}

export function useUpdateSharing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isShared }: { id: string; isShared: boolean }) =>
      medicalRecordsApi.updateSharing(id, isShared),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: medicalRecordKeys.detail(variables.id) });
    },
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      medicalRecordsApi.uploadAttachment(id, file),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: medicalRecordKeys.detail(variables.id) });
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) =>
      medicalRecordsApi.deleteAttachment(id, attachmentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: medicalRecordKeys.detail(variables.id) });
    },
  });
}
