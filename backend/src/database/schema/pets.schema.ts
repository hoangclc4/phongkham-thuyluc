import { pgTable, uuid, varchar, text, boolean, decimal, date, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { customers } from './customers.schema';

export const petSpeciesEnum = pgEnum('pet_species', ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'reptile', 'other']);
export const petGenderEnum  = pgEnum('pet_gender',  ['male', 'female', 'unknown']);
export const petStatusEnum  = pgEnum('pet_status',  ['healthy', 'in_treatment', 'monitoring', 'deceased', 'transferred']);

export const pets = pgTable('pets', {
  id:             uuid('id').primaryKey().defaultRandom(),
  customerId:     uuid('customer_id').notNull().references(() => customers.id),
  name:           varchar('name', { length: 50 }).notNull(),
  species:        petSpeciesEnum('species').notNull(),
  breed:          varchar('breed', { length: 100 }),
  gender:         petGenderEnum('gender').notNull().default('unknown'),
  dateOfBirth:    date('date_of_birth'),
  color:          varchar('color', { length: 100 }),
  weightKg:       decimal('weight_kg', { precision: 5, scale: 2 }),
  avatarUrl:      text('avatar_url'),
  status:         petStatusEnum('status').notNull().default('healthy'),
  knownAllergies: text('known_allergies').array(),
  microchipId:    varchar('microchip_id', { length: 50 }),
  notes:          text('notes'),
  isNeutered:     boolean('is_neutered').default(false),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt:      timestamp('deleted_at', { withTimezone: true }),
});

export type Pet = typeof pets.$inferSelect;
export type NewPet = typeof pets.$inferInsert;
