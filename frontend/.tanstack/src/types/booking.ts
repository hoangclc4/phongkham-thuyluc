export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type ServiceType =
  | 'general_checkup'
  | 'followup'
  | 'vaccination'
  | 'surgery'
  | 'grooming'
  | 'laboratory'
  | 'dental'
  | 'emergency'
  | 'other';

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  checked_in: 'Đã đến',
  in_progress: 'Đang khám',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
  no_show: 'Không đến',
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  checked_in: '#8b5cf6',
  in_progress: '#10b981',
  completed: '#6b7280',
  cancelled: '#ef4444',
  no_show: '#9ca3af',
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  general_checkup: 'Khám tổng quát',
  followup: 'Tái khám',
  vaccination: 'Tiêm phòng',
  surgery: 'Phẫu thuật',
  grooming: 'Grooming',
  laboratory: 'Xét nghiệm',
  dental: 'Nha khoa',
  emergency: 'Cấp cứu',
  other: 'Khác',
};

export interface BookingCustomer {
  id: string;
  displayName: string;
  phone: string;
}

export interface BookingPet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  avatarUrl: string | null;
}

export interface Booking {
  id: string;
  displayNumber: string;
  customer: BookingCustomer;
  pet: BookingPet;
  serviceType: ServiceType;
  serviceLabel: string;
  scheduledAt: string;
  durationMinutes: number;
  status: BookingStatus;
  statusLabel: string;
  source: string;
  notes: string | null;
  createdAt: string;
}

export interface BookingListParams {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: BookingStatus;
  serviceType?: ServiceType;
  customerId?: string;
  petId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateBookingDto {
  customerId: string;
  petId: string;
  serviceType: ServiceType;
  scheduledAt: string;
  durationMinutes?: number;
  notes?: string;
}

export interface UpdateBookingStatusDto {
  status: BookingStatus;
}

export interface TimeSlot {
  time: string;
  bookingCount: number;
  available: boolean;
  customerAlreadyBooked: boolean;
  bookings: Array<{
    displayNumber: string;
    customerName: string;
    petName: string;
  }>;
}
