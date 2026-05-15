import { bookingServiceEnum, bookingSourceEnum, bookingStatusEnum } from '../../../database/schema/bookings.schema';

export type BookingStatusValue = (typeof bookingStatusEnum.enumValues)[number];
export type BookingServiceValue = (typeof bookingServiceEnum.enumValues)[number];
export type BookingSourceValue = (typeof bookingSourceEnum.enumValues)[number];

export const SLOT_START_HOUR = 8;
export const SLOT_END_HOUR = 18;
export const SLOT_DURATION_MINUTES = 30;
export const MAX_BOOKINGS_PER_SLOT = 2;
export const VN_TIMEZONE_OFFSET_MS = 7 * 60 * 60 * 1000;

export const STATUS_LABELS: Record<BookingStatusValue, string> = {
  pending:     'Chờ xác nhận',
  confirmed:   'Đã xác nhận',
  checked_in:  'Đã đến',
  in_progress: 'Đang khám',
  completed:   'Hoàn thành',
  cancelled:   'Đã huỷ',
  no_show:     'Không đến',
};

export const SERVICE_LABELS: Record<BookingServiceValue, string> = {
  general_checkup: 'Khám tổng quát',
  followup:        'Tái khám',
  vaccination:     'Tiêm phòng',
  surgery:         'Phẫu thuật',
  grooming:        'Grooming',
  laboratory:      'Xét nghiệm',
  dental:          'Nha khoa',
  emergency:       'Cấp cứu',
  other:           'Khác',
};

export const VALID_STATUS_TRANSITIONS: Record<BookingStatusValue, BookingStatusValue[]> = {
  pending:     ['confirmed', 'cancelled'],
  confirmed:   ['checked_in', 'cancelled', 'no_show'],
  checked_in:  ['in_progress'],
  in_progress: ['completed'],
  completed:   [],
  cancelled:   [],
  no_show:     [],
};

export const TERMINAL_STATUSES: BookingStatusValue[] = ['completed', 'cancelled', 'no_show'];
export const CANCELLABLE_STATUSES: BookingStatusValue[] = ['pending', 'confirmed'];
export const ACTIVE_SLOT_STATUSES: BookingStatusValue[] = ['pending', 'confirmed', 'checked_in', 'in_progress'];
