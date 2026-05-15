export type PaymentMethod = 'cash' | 'bank_transfer' | 'momo' | 'zalopay' | 'other';
export type PaymentStatus = 'pending' | 'partially_paid' | 'paid' | 'overdue';
export type LineItemCategory = 'examination' | 'medication' | 'lab' | 'surgery' | 'grooming' | 'other';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  momo: 'MoMo',
  zalopay: 'ZaloPay',
  other: 'Khác',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Chờ thanh toán',
  partially_paid: 'Thanh toán một phần',
  paid: 'Đã thanh toán',
  overdue: 'Quá hạn',
};

export const LINE_ITEM_CATEGORY_LABELS: Record<LineItemCategory, string> = {
  examination: 'Phí khám',
  medication: 'Thuốc',
  lab: 'Xét nghiệm',
  surgery: 'Phẫu thuật',
  grooming: 'Grooming',
  other: 'Khác',
};

export interface LineItem {
  description: string;
  category: LineItemCategory;
  categoryLabel: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceLinkedBooking {
  displayNumber: string;
  serviceLabel: string;
}

export interface InvoiceLinkedRecord {
  displayNumber: string;
}

export interface Invoice {
  id: string;
  displayNumber: string;
  linkedBooking: InvoiceLinkedBooking | null;
  linkedMedicalRecord: InvoiceLinkedRecord | null;
  customer: { fullName: string; phone: string };
  pet: { name: string; species: string };
  lineItems: LineItem[];
  subtotal: number;
  discountAmount: number;
  discountReason: string | null;
  totalAmount: number;
  totalDisplay: string;
  paymentMethod: PaymentMethod | null;
  paymentMethodLabel: string | null;
  paymentStatus: PaymentStatus;
  paymentStatusLabel: string;
  paidAmount: number;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateInvoiceDto {
  bookingId?: string;
  medicalRecordId?: string;
  customerId: string;
  petId: string;
  lineItems: Omit<LineItem, 'categoryLabel' | 'total'>[];
  discountAmount?: number;
  discountReason?: string;
  notes?: string;
}

export interface ProcessPaymentDto {
  paymentMethod: PaymentMethod;
  paidAmount: number;
}
