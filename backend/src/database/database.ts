import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const postgresLib = require('postgres');
const postgres = (postgresLib.default ?? postgresLib) as typeof import('postgres');

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
export type Db = typeof db;
