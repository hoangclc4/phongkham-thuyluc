import { pgTable, uuid, varchar, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { customers } from './customers.schema';

export const aiConversations = pgTable('ai_conversations', {
  id:              uuid('id').primaryKey().defaultRandom(),
  customerId:      uuid('customer_id').notNull().references(() => customers.id),
  sessionId:       varchar('session_id', { length: 50 }).notNull().unique(),
  messages:        jsonb('messages').notNull().default([]),
  contextSnapshot: jsonb('context_snapshot'),
  tokensInput:     integer('tokens_input').notNull().default(0),
  tokensOutput:    integer('tokens_output').notNull().default(0),
  modelUsed:       varchar('model_used', { length: 50 }),
  endedAt:         timestamp('ended_at', { withTimezone: true }),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type AiConversation = typeof aiConversations.$inferSelect;
export type NewAiConversation = typeof aiConversations.$inferInsert;
