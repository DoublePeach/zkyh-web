import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';
import { DB_CONFIG } from './src/lib/config';

// 加载环境变量
dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
});

export default {
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: DB_CONFIG.HOST,
    port: DB_CONFIG.PORT,
    user: DB_CONFIG.USER,
    password: DB_CONFIG.PASSWORD,
    database: DB_CONFIG.DATABASE
  }
} satisfies Config; 