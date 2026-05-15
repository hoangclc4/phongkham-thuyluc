import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const adminUsers = pgTable('admin_users', {
  id:           uuid('id').primaryKey().defaultRandom(),
  email:        varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName:     varchar('full_name', { length: 100 }).notNull(),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
