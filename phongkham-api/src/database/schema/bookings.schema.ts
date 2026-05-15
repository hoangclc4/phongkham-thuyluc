import { pgTable, uuid, varchar, integer, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { customers } from './customers.schema';
import { pets } from './pets.schema';
import { adminUsers } from './admin-users.schema';

export const bookingServiceEnum = pgEnum('booking_service', [
  'general_checkup', 'followup', 'vaccination', 'surgery',
  'grooming', 'laboratory', 'dental', 'emergency', 'other',
]);

export const bookingStatusEnum = pgEnum('booking_status', [
  'pending', 'confirmed', 'checked_in', 'in_progress',
  'completed', 'cancelled', 'no_show',
]);

export const bookingSourceEnum = pgEnum('booking_source', [
  'customer_portal', 'ai_chat', 'admin', 'phone',
]);

export const bookings = pgTable('bookings', {
  id:              uuid('id').primaryKey().defaultRandom(),
  displayNumber:   varchar('display_number', { length: 20 }).notNull().unique(),
  customerId:      uuid('customer_id').notNull().references(() => customers.id),
  petId:           uuid('pet_id').notNull().references(() => pets.id),
  serviceType:     bookingServiceEnum('service_type').notNull(),
  scheduledAt:     timestamp('scheduled_at', { withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(30),
  status:          bookingStatusEnum('status').notNull().default('pending'),
  source:          bookingSourceEnum('source').notNull().default('admin'),
  notes:           text('notes'),
  adminNotes:      text('admin_notes'),
  cancelledAt:     timestamp('cancelled_at', { withTimezone: true }),
  cancelledBy:     varchar('cancelled_by', { length: 10 }),
  cancelledReason: text('cancelled_reason'),
  confirmedAt:     timestamp('confirmed_at', { withTimezone: true }),
  checkedInAt:     timestamp('checked_in_at', { withTimezone: true }),
  completedAt:     timestamp('completed_at', { withTimezone: true }),
  createdBy:       uuid('created_by').references(() => adminUsers.id),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
