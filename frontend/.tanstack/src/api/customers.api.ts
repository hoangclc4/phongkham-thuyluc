import { api } from '@/lib/api';
import type { Customer, CreateCustomerDto, UpdateCustomerDto, CustomerListParams } from '@/types/customer';
import type { Pet } from '@/types/pet';
import type { Booking } from '@/types/booking';
import type { PaginatedResponse } from '@/types/api';

export async function list(params: CustomerListParams): Promise<PaginatedResponse<Customer>> {
  const response = await api.get<PaginatedResponse<Customer>>('/admin/customers', { params });
  return response.data;
}

export async function get(id: string): Promise<Customer> {
  const response = await api.get<Customer>(`/admin/customers/${id}`);
  return response.data;
}

export async function create(dto: CreateCustomerDto): Promise<Customer> {
  const response = await api.post<Customer>('/admin/customers', dto);
  return response.data;
}

export async function update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
  const response = await api.put<Customer>(`/admin/customers/${id}`, dto);
  return response.data;
}

export async function getPets(customerId: string): Promise<Pet[]> {
  const response = await api.get<Pet[]>(`/admin/customers/${customerId}/pets`);
  return response.data;
}

export async function getBookings(customerId: string): Promise<Booking[]> {
  const response = await api.get<Booking[]>(`/admin/customers/${customerId}/bookings`);
  return response.data;
}

export async function sendInvite(customerId: string): Promise<void> {
  await api.post(`/admin/customers/${customerId}/invite`);
}
