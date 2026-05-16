export interface BookingCustomerInfo {
  id: string;
  displayName: string;
  phone: string;
}

export interface BookingPetInfo {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  avatarUrl: string | null;
}

export interface BookingResponse {
  id: string;
  displayNumber: string;
  customer: BookingCustomerInfo;
  pet: BookingPetInfo;
  serviceType: string;
  serviceLabel: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  statusLabel: string;
  source: string;
  notes: string | null;
  adminNotes: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancelledReason: string | null;
  createdAt: string;
}

export interface BookingListResponse {
  data: BookingResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface TimeSlotBookingInfo {
  displayNumber: string;
  customerName: string;
  petName: string;
}

export interface TimeSlot {
  time: string;
  bookingCount: number;
  available: boolean;
  customerAlreadyBooked: boolean;
  bookings: TimeSlotBookingInfo[];
}
