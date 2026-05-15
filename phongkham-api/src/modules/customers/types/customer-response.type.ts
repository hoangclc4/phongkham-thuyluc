export interface CustomerStatsResponse {
  totalVisits: number;
  totalSpent: number;
  lastVisitDate: string | null;
  petsCount: number;
}

export interface CustomerListItem {
  id: string;
  phone: string;
  fullName: string;
  email: string | null;
  isActive: boolean;
  hasAccount: boolean;
  stats: CustomerStatsResponse;
  createdAt: string;
}

export interface CustomerResponse extends CustomerListItem {
  address: string | null;
  internalNotes: string | null;
  lastLoginAt: string | null;
}

export interface CustomerListResponse {
  data: CustomerListItem[];
  total: number;
  page: number;
  limit: number;
}
