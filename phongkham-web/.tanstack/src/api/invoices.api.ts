import { api } from '@/lib/api';
import type { Invoice, CreateInvoiceDto, ProcessPaymentDto, PaymentStatus } from '@/types/invoice';
import type { PaginatedResponse } from '@/types/api';

interface InvoiceListParams {
  page?: number;
  limit?: number;
  paymentStatus?: PaymentStatus;
}

export async function get(id: string): Promise<Invoice> {
  const response = await api.get<Invoice>(`/admin/invoices/${id}`);
  return response.data;
}

export async function create(dto: CreateInvoiceDto): Promise<Invoice> {
  const response = await api.post<Invoice>('/admin/invoices', dto);
  return response.data;
}

export async function update(id: string, dto: Partial<CreateInvoiceDto>): Promise<Invoice> {
  const response = await api.put<Invoice>(`/admin/invoices/${id}`, dto);
  return response.data;
}

export async function processPayment(id: string, dto: ProcessPaymentDto): Promise<Invoice> {
  const response = await api.post<Invoice>(`/admin/invoices/${id}/payment`, dto);
  return response.data;
}

export async function list(params?: InvoiceListParams): Promise<PaginatedResponse<Invoice>> {
  const response = await api.get<PaginatedResponse<Invoice>>('/admin/invoices', { params });
  return response.data;
}
