/**
 * @description 数据库连接配置
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { schema } from './schema';

// 数据库连接字符串
// const connectionString = process.env.DATABASE_URL || 'postgres://postgres:@localhost:5432/zkyh_db';
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:3333@124.220.178.188:5432/zkyh_db';

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