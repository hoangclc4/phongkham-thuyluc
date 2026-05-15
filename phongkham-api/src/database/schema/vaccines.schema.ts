import { pgTable, uuid, varchar, text, date, timestamp } from 'drizzle-orm/pg-core';
import { pets } from './pets.schema';
import { adminUsers } from './admin-users.schema';

export const vaccines = pgTable('vaccines', {
  id:             uuid('id').primaryKey().defaultRandom(),
  petId:          uuid('pet_id').notNull().references(() => pets.id, { onDelete: 'cascade' }),
  vaccineName:    varchar('vaccine_name', { length: 100 }).notNull(),
  administeredAt: date('administered_at').notNull(),
  nextDueAt:      date('next_due_at'),
  batchNumber:    varchar('batch_number', { length: 50 }),
  notes:          text('notes'),
  createdBy:      uuid('created_by').notNull().references(() => adminUsers.id),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Vaccine = typeof vaccines.$inferSelect;
export type NewVaccine = typeof vaccines.$inferInsert;
