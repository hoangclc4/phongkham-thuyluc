import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as customerApi from '@/api/customer.api';
import type { ServiceType } from '@/types/booking';
import type { ChatDto } from '@/types/ai';

export const portalKeys = {
  all: ['portal'] as const,
  profile: () => [...portalKeys.all, 'profile'] as const,
  pets: () => [...portalKeys.all, 'pets'] as const,
  pet: (id: string) => [...portalKeys.all, 'pet', id] as const,
  bookings: () => [...portalKeys.all, 'bookings'] as const,
  slots: (date: string) => [...portalKeys.all, 'slots', date] as const,
  medicalRecords: (petId: string) => [...portalKeys.all, 'medical-records', petId] as const,
};

export function useMyProfile() {
  return useQuery({
    queryKey: portalKeys.profile(),
    queryFn: () => customerApi.getProfile(),
  });
}

export function useMyPets() {
  return useQuery({
    queryKey: portalKeys.pets(),
    queryFn: () => customerApi.getMyPets(),
  });
}

export function useMyPet(id: string) {
  return useQuery({
    queryKey: portalKeys.pet(id),
    queryFn: () => customerApi.getMyPet(id),
    enabled: Boolean(id),
  });
}

export function useMyBookings() {
  return useQuery({
    queryKey: portalKeys.bookings(),
    queryFn: () => customerApi.getMyBookings(),
  });
}

export function useMyBookingSlots(date: string) {
  return useQuery({
    queryKey: portalKeys.slots(date),
    queryFn: () => customerApi.getBookingSlots(date),
    enabled: Boolean(date),
  });
}

export function useMyMedicalRecords(petId: string) {
  return useQuery({
    queryKey: portalKeys.medicalRecords(petId),
    queryFn: () => customerApi.getMedicalRecords(petId),
    enabled: Boolean(petId),
  });
}

export function useCreateMyBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { petId: string; serviceType: ServiceType; scheduledAt: string; notes?: string }) =>
      customerApi.createBooking(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portalKeys.bookings() });
    },
  });
}

export function useCancelMyBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customerApi.cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portalKeys.bookings() });
    },
  });
}

export function useChatMutation() {
  return useMutation({
    mutationFn: (dto: ChatDto) => customerApi.chat(dto),
  });
}
