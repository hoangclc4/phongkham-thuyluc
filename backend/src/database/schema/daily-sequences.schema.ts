import { pgTable, varchar, date, integer, primaryKey } from 'drizzle-orm/pg-core';

export const dailySequences = pgTable('daily_sequences', {
  entityType: varchar('entity_type', { length: 10 }).notNull(),
  seqDate:    date('seq_date').notNull(),
  lastVal:    integer('last_val').notNull().default(0),
}, (table) => [
  primaryKey({ columns: [table.entityType, table.seqDate] }),
]);

export type DailySequence = typeof dailySequences.$inferSelect;
