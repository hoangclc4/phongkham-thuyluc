import { pgTable, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const aiContextCache = pgTable('ai_context_cache', {
  cacheKey:    varchar('cache_key', { length: 200 }).primaryKey(),
  contextData: jsonb('context_data').notNull(),
  expiresAt:   timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type AiContextCache = typeof aiContextCache.$inferSelect;
export type NewAiContextCache = typeof aiContextCache.$inferInsert;
