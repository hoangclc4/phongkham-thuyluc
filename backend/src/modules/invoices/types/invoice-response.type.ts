export interface LineItem {
  description:   string;
  category:      string;
  categoryLabel: string;
  quantity:      number;
  unitPrice:     number;
  total:         number;
}

export interface LinkedBookingInfo {
  displayNumber: string;
  serviceLabel:  string;
}

export interface LinkedMedicalRecordInfo {
  displayNumber: string;
}

export interface InvoiceCustomer {
  fullName: string;
  phone:    string;
}

export interface InvoicePet {
  name:    string;
  species: string;
}

export interface InvoiceResponse {
  id:                  string;
  displayNumber:       string;
  linkedBooking:       LinkedBookingInfo | null;
  linkedMedicalRecord: LinkedMedicalRecordInfo | null;
  customer:            InvoiceCustomer;
  pet:                 InvoicePet;
  lineItems:           LineItem[];
  subtotal:            number;
  discountAmount:      number;
  discountReason:      string | null;
  totalAmount:         number;
  totalDisplay:        string;
  paymentMethod:       string | null;
  paymentMethodLabel:  string | null;
  paymentStatus:       string;
  paymentStatusLabel:  string;
  paidAmount:          number;
  paidAt:              string | null;
  notes:               string | null;
  createdAt:           string;
  updatedAt:           string;
}

export interface InvoiceListItem {
  id:                string;
  displayNumber:     string;
  customerFullName:  string;
  customerPhone:     string;
  petName:           string;
  petSpecies:        string;
  subtotal:          number;
  discountAmount:    number;
  totalAmount:       number;
  totalDisplay:      string;
  paymentStatus:     string;
  paymentStatusLabel: string;
  paidAmount:        number;
  createdAt:         string;
}

export interface InvoiceListResponse {
  data:  InvoiceListItem[];
  total: number;
  page:  number;
  limit: number;
}
