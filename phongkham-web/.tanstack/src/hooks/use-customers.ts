import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as customersApi from '@/api/customers.api';
import type { CustomerListParams, CreateCustomerDto, UpdateCustomerDto } from '@/types/customer';

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params: CustomerListParams) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  pets: (customerId: string) => [...customerKeys.all, 'pets', customerId] as const,
  bookings: (customerId: string) => [...customerKeys.all, 'bookings', customerId] as const,
};

export function useCustomers(params: CustomerListParams) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => customersApi.list(params),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customersApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCustomerPets(customerId: string) {
  return useQuery({
    queryKey: customerKeys.pets(customerId),
    queryFn: () => customersApi.getPets(customerId),
    enabled: Boolean(customerId),
  });
}

export function useCustomerBookings(customerId: string) {
  return useQuery({
    queryKey: customerKeys.bookings(customerId),
    queryFn: () => customersApi.getBookings(customerId),
    enabled: Boolean(customerId),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCustomerDto) => customersApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCustomerDto }) =>
      customersApi.update(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useSendInvite() {
  return useMutation({
    mutationFn: (customerId: string) => customersApi.sendInvite(customerId),
  });
}
