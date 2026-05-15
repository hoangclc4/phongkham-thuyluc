import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as invoicesApi from '@/api/invoices.api';
import type { CreateInvoiceDto, ProcessPaymentDto, PaymentStatus } from '@/types/invoice';

interface InvoiceListParams {
  page?: number;
  limit?: number;
  paymentStatus?: PaymentStatus;
}

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (params?: InvoiceListParams) => [...invoiceKeys.lists(), params] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
};

export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => invoicesApi.get(id),
    enabled: Boolean(id),
  });
}

export function useInvoices(params?: InvoiceListParams) {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: () => invoicesApi.list(params),
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateInvoiceDto) => invoicesApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateInvoiceDto> }) =>
      invoicesApi.update(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

export function useProcessPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ProcessPaymentDto }) =>
      invoicesApi.processPayment(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}
