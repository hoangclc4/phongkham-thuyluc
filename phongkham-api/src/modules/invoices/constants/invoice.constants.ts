export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash:          'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  momo:          'MoMo',
  zalopay:       'ZaloPay',
  other:         'Khác',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending:         'Chờ thanh toán',
  paid:            'Đã thanh toán',
  partially_paid:  'Thanh toán một phần',
  waived:          'Miễn phí',
  refunded:        'Đã hoàn tiền',
};

export const LINE_ITEM_CATEGORY_LABELS: Record<string, string> = {
  examination: 'Phí khám',
  medication:  'Thuốc',
  lab:         'Xét nghiệm',
  surgery:     'Phẫu thuật',
  grooming:    'Grooming',
  other:       'Khác',
};

export const LINE_ITEM_CATEGORIES = ['examination', 'medication', 'lab', 'surgery', 'grooming', 'other'] as const;
export type LineItemCategory = (typeof LINE_ITEM_CATEGORIES)[number];

export const EDITABLE_PAYMENT_STATUSES = ['pending', 'partially_paid'] as const;
export type EditablePaymentStatus = (typeof EDITABLE_PAYMENT_STATUSES)[number];

export const NON_EDITABLE_PAYMENT_STATUSES = ['paid', 'waived', 'refunded'] as const;

export const BOOKING_SERVICE_LABELS: Record<string, string> = {
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
