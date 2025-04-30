import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// 确保数据库URL存在
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/zkyh_db';

// 创建PostgreSQL客户端
const client = postgres(DATABASE_URL);

// 创建Drizzle ORM实例
export const db = drizzle(client, { schema });

// 导出数据模型以便在其他地方使用
export * from './schema'; 