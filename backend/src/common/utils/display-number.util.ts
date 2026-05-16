import { db } from '../../database/database';
import { sql } from 'drizzle-orm';

export type EntityType = 'BKG' | 'MED' | 'INV';

function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

export async function generateDisplayNumber(type: EntityType, date: Date = new Date()): Promise<string> {
  const dateStr = formatDateStr(date);
  const result = await db.execute(
    sql`SELECT generate_display_number(${type}, ${dateStr}::DATE) as display_number`,
  );
  return result[0].display_number as string;
}
