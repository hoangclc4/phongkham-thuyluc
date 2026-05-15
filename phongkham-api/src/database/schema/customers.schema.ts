import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const customers = pgTable('customers', {
  id:                        uuid('id').primaryKey().defaultRandom(),
  fullName:                  varchar('full_name', { length: 100 }).notNull(),
  phone:                     varchar('phone', { length: 15 }).notNull().unique(),
  email:                     varchar('email', { length: 255 }),
  address:                   text('address'),
  passwordHash:              varchar('password_hash', { length: 255 }),
  passwordResetToken:        varchar('password_reset_token', { length: 255 }),
  passwordResetTokenExpires: timestamp('password_reset_token_expires', { withTimezone: true }),
  internalNotes:             text('internal_notes'),
  isActive:                  boolean('is_active').notNull().default(true),
  createdAt:                 timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:                 timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt:               timestamp('last_login_at', { withTimezone: true }),
  deletedAt:                 timestamp('deleted_at', { withTimezone: true }),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
