export const CUSTOMER_CANCELLABLE_STATUSES = ['pending', 'confirmed'] as const;
export const BOOKING_CANCEL_ADVANCE_HOURS = 24;
export const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

export const SERVICE_LABELS: Record<string, string> = {
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

export const STATUS_LABELS: Record<string, string> = {
  pending:     'Chờ xác nhận',
  confirmed:   'Đã xác nhận',
  checked_in:  'Đã đến',
  in_progress: 'Đang khám',
  completed:   'Hoàn thành',
  cancelled:   'Đã huỷ',
  no_show:     'Không đến',
};
