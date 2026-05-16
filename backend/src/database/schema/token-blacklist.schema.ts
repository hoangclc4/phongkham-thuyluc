import { pgTable, varchar, timestamp } from 'drizzle-orm/pg-core';

export const tokenBlacklist = pgTable('token_blacklist', {
  jti:       varchar('jti', { length: 36 }).primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export type TokenBlacklist = typeof tokenBlacklist.$inferSelect;
export type NewTokenBlacklist = typeof tokenBlacklist.$inferInsert;
