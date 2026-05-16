import { pgTable, uuid, date, text, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const morningReports = pgTable('morning_reports', {
  id:          uuid('id').primaryKey().defaultRandom(),
  reportDate:  date('report_date').notNull().unique(),
  content:     text('content').notNull(),
  summary:     jsonb('summary'),
  tokensUsed:  integer('tokens_used'),
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type MorningReport = typeof morningReports.$inferSelect;
export type NewMorningReport = typeof morningReports.$inferInsert;
