export interface CustomerStats {
  totalVisits: number;
  totalSpent: number;
  lastVisitDate: string | null;
  petsCount: number;
}

export interface Customer {
  id: string;
  phone: string;
  fullName: string;
  email: string | null;
  address: string | null;
  isActive: boolean;
  hasAccount: boolean;
  internalNotes: string | null;
  stats: CustomerStats;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface CreateCustomerDto {
  phone: string;
  fullName: string;
  email?: string;
  address?: string;
}

export interface UpdateCustomerDto {
  fullName?: string;
  email?: string;
  address?: string;
  internalNotes?: string;
}

export interface CustomerListParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CustomerPortalProfile {
  id: string;
  phone: string;
  fullName: string;
  email: string | null;
  address: string | null;
}
