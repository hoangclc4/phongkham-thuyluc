import { api } from '@/lib/api';
import type { CustomerPortalProfile } from '@/types/customer';
import type { Pet } from '@/types/pet';
import type { Booking, TimeSlot, ServiceType } from '@/types/booking';
import type { MedicalRecord } from '@/types/medical-record';
import type { ChatDto, ChatResponse } from '@/types/ai';

export async function getProfile(): Promise<CustomerPortalProfile> {
  const response = await api.get<CustomerPortalProfile>('/customer/profile');
  return response.data;
}

export async function updateProfile(dto: { email?: string; address?: string }): Promise<CustomerPortalProfile> {
  const response = await api.put<CustomerPortalProfile>('/customer/profile', dto);
  return response.data;
}

export async function getMyPets(): Promise<Pet[]> {
  const response = await api.get<Pet[]>('/customer/pets');
  return response.data;
}

export async function getMyPet(id: string): Promise<Pet> {
  const response = await api.get<Pet>(`/customer/pets/${id}`);
  return response.data;
}

export async function getMyBookings(): Promise<Booking[]> {
  const response = await api.get<Booking[]>('/customer/bookings');
  return response.data;
}

export async function createBooking(dto: {
  petId: string;
  serviceType: ServiceType;
  scheduledAt: string;
  notes?: string;
}): Promise<Booking> {
  const response = await api.post<Booking>('/customer/bookings', dto);
  return response.data;
}

export async function cancelBooking(id: string): Promise<void> {
  await api.post(`/customer/bookings/${id}/cancel`);
}

export async function getBookingSlots(date: string): Promise<TimeSlot[]> {
  const response = await api.get<TimeSlot[]>('/customer/bookings/slots', { params: { date } });
  return response.data;
}

export async function chat(dto: ChatDto): Promise<ChatResponse> {
  const response = await api.post<ChatResponse>('/customer/ai/chat', dto);
  return response.data;
}

export async function getMedicalRecords(petId: string): Promise<MedicalRecord[]> {
  const response = await api.get<MedicalRecord[]>(`/customer/pets/${petId}/medical-records`);
  return response.data;
}
