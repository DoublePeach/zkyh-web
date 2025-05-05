import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // host: '124.220.178.188',
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    // password: '3333',
    password: '',
    database: 'zkyh_db1'
  }
} satisfies Config; 