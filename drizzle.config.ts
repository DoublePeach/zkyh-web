import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // host: 'localhost',
    host: '124.220.178.188',
    port: 5432,
    user: 'postgres',
    password: '3333',
    database: 'zkyh_db'
  }
} satisfies Config; 