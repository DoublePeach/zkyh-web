/**
 * @description 数据库连接配置
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { schema } from './schema';
import { DB_CONFIG } from '@/lib/config';

// 数据库连接字符串
const connectionString = process.env.DATABASE_URL || DB_CONFIG.PG_CONNECTION_STRING;

// 创建数据库客户端 - 用于查询
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

// 创建迁移客户端 - 用于迁移
export const runMigrations = async () => {
  const migrationClient = postgres(connectionString, { max: 1 });
  try {
    await migrate(drizzle(migrationClient), { migrationsFolder: './drizzle' });
    console.log('迁移完成');
  } catch (error) {
    console.error('迁移失败:', error);
  } finally {
    await migrationClient.end();
  }
}

// 导出数据模型以便在其他地方使用
export * from './schema'; 