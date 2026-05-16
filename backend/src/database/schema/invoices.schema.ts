import { pgTable, uuid, varchar, bigint, text, jsonb, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { customers } from './customers.schema';
import { pets } from './pets.schema';
import { bookings } from './bookings.schema';
import { medicalRecords } from './medical-records.schema';
import { adminUsers } from './admin-users.schema';

export const invoicePaymentMethodEnum = pgEnum('invoice_payment_method', [
  'cash', 'bank_transfer', 'momo', 'zalopay', 'other',
]);

export const invoicePaymentStatusEnum = pgEnum('invoice_payment_status', [
  'pending', 'paid', 'partially_paid', 'waived', 'refunded',
]);

export const invoices = pgTable('invoices', {
  id:              uuid('id').primaryKey().defaultRandom(),
  displayNumber:   varchar('display_number', { length: 20 }).notNull().unique(),
  bookingId:       uuid('booking_id').references(() => bookings.id),
  medicalRecordId: uuid('medical_record_id').references(() => medicalRecords.id),
  customerId:      uuid('customer_id').notNull().references(() => customers.id),
  petId:           uuid('pet_id').notNull().references(() => pets.id),
  lineItems:       jsonb('line_items').notNull(),
  subtotal:        bigint('subtotal', { mode: 'number' }).notNull(),
  discountAmount:  bigint('discount_amount', { mode: 'number' }).notNull().default(0),
  discountReason:  text('discount_reason'),
  totalAmount:     bigint('total_amount', { mode: 'number' }).notNull(),
  paymentMethod:   invoicePaymentMethodEnum('payment_method'),
  paymentStatus:   invoicePaymentStatusEnum('payment_status').notNull().default('pending'),
  paidAmount:      bigint('paid_amount', { mode: 'number' }).notNull().default(0),
  paidAt:          timestamp('paid_at', { withTimezone: true }),
  notes:           text('notes'),
  createdBy:       uuid('created_by').notNull().references(() => adminUsers.id),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
