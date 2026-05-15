import { api } from '@/lib/api';
import type {
  Booking,
  BookingListParams,
  CreateBookingDto,
  TimeSlot,
  UpdateBookingStatusDto,
} from '@/types/booking';
import type { PaginatedResponse } from '@/types/api';

export async function list(params: BookingListParams): Promise<PaginatedResponse<Booking>> {
  const response = await api.get<PaginatedResponse<Booking>>('/admin/bookings', { params });
  return response.data;
}

export async function get(id: string): Promise<Booking> {
  const response = await api.get<Booking>(`/admin/bookings/${id}`);
  return response.data;
}

export async function create(dto: CreateBookingDto): Promise<Booking> {
  const response = await api.post<Booking>('/admin/bookings', dto);
  return response.data;
}

export async function update(id: string, dto: Partial<CreateBookingDto>): Promise<Booking> {
  const response = await api.put<Booking>(`/admin/bookings/${id}`, dto);
  return response.data;
}

export async function updateStatus(id: string, dto: UpdateBookingStatusDto): Promise<Booking> {
  const response = await api.patch<Booking>(`/admin/bookings/${id}/status`, dto);
  return response.data;
}

export async function getSlots(date: string, customerId?: string): Promise<TimeSlot[]> {
  const response = await api.get<TimeSlot[]>('/admin/bookings/slots', {
    params: { date, customerId },
  });
  return response.data;
}

export async function getToday(): Promise<Booking[]> {
  const response = await api.get<Booking[]>('/admin/bookings/today');
  return response.data;
}

export async function deleteBooking(id: string): Promise<void> {
  await api.delete(`/admin/bookings/${id}`);
}
