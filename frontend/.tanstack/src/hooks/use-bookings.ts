import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as bookingsApi from '@/api/bookings.api';
import type { BookingListParams, CreateBookingDto, UpdateBookingStatusDto } from '@/types/booking';

export const bookingKeys = {
  all: ['bookings'] as const,
  lists: () => [...bookingKeys.all, 'list'] as const,
  list: (params: BookingListParams) => [...bookingKeys.lists(), params] as const,
  details: () => [...bookingKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookingKeys.details(), id] as const,
  slots: (date: string, customerId?: string) => [...bookingKeys.all, 'slots', date, customerId] as const,
  today: () => [...bookingKeys.all, 'today'] as const,
};

export function useBookings(params: BookingListParams, enabled = true) {
  return useQuery({
    queryKey: bookingKeys.list(params),
    queryFn: () => bookingsApi.list(params),
    enabled,
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => bookingsApi.get(id),
    enabled: Boolean(id),
  });
}

export function useBookingSlots(date: string, customerId?: string) {
  return useQuery({
    queryKey: bookingKeys.slots(date, customerId),
    queryFn: () => bookingsApi.getSlots(date, customerId),
    enabled: Boolean(date),
  });
}

export function useTodayBookings() {
  return useQuery({
    queryKey: bookingKeys.today(),
    queryFn: () => bookingsApi.getToday(),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateBookingDto) => bookingsApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookingKeys.today() });
    },
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateBookingDto> }) =>
      bookingsApi.update(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBookingStatusDto }) =>
      bookingsApi.updateStatus(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookingKeys.today() });
    },
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingsApi.deleteBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookingKeys.today() });
    },
  });
}
