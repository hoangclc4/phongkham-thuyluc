import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

export const DB_TOKEN = 'DRIZZLE_DB';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const postgresLib = require('postgres');
const postgres = (postgresLib.default ?? postgresLib) as typeof import('postgres');

@Global()
@Module({
  providers: [
    {
      provide: DB_TOKEN,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const client = postgres(config.getOrThrow<string>('DATABASE_URL'));
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DB_TOKEN],
})
export class DatabaseModule {}
