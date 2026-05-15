import { pgTable, uuid, varchar, text, decimal, date, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { pets } from './pets.schema';
import { bookings } from './bookings.schema';
import { adminUsers } from './admin-users.schema';

export const medicalRecords = pgTable('medical_records', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  displayNumber:        varchar('display_number', { length: 20 }).notNull().unique(),
  bookingId:            uuid('booking_id').references(() => bookings.id),
  petId:                uuid('pet_id').notNull().references(() => pets.id),
  visitDate:            date('visit_date').notNull(),
  weightAtVisit:        decimal('weight_at_visit', { precision: 5, scale: 2 }),
  temperatureCelsius:   decimal('temperature_celsius', { precision: 4, scale: 1 }),
  chiefComplaint:       text('chief_complaint').notNull(),
  physicalExamination:  text('physical_examination'),
  diagnosis:            text('diagnosis'),
  diagnosisNotes:       text('diagnosis_notes'),
  treatmentPlan:        jsonb('treatment_plan'),
  doctorNotes:          text('doctor_notes'),
  followupDate:         date('followup_date'),
  followupNotes:        text('followup_notes'),
  attachments:          jsonb('attachments'),
  isSharedWithCustomer: boolean('is_shared_with_customer').notNull().default(false),
  requiresAttention:    boolean('requires_attention').notNull().default(false),
  attentionReason:      text('attention_reason'),
  createdBy:            uuid('created_by').notNull().references(() => adminUsers.id),
  createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type NewMedicalRecord = typeof medicalRecords.$inferInsert;
