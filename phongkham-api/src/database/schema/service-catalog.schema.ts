import { pgTable, uuid, varchar, bigint, integer, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { bookingServiceEnum } from './bookings.schema';

export const serviceCatalog = pgTable('service_catalog', {
  id:           uuid('id').primaryKey().defaultRandom(),
  name:         varchar('name', { length: 100 }).notNull(),
  category:     bookingServiceEnum('category').notNull(),
  defaultPrice: bigint('default_price', { mode: 'number' }).notNull(),
  durationMin:  integer('duration_min').notNull().default(30),
  description:  text('description'),
  isActive:     boolean('is_active').notNull().default(true),
  sortOrder:    integer('sort_order').default(0),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ServiceCatalogItem = typeof serviceCatalog.$inferSelect;
export type NewServiceCatalogItem = typeof serviceCatalog.$inferInsert;
