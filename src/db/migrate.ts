import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

// 确保环境变量存在
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/zkyh_db';

// 迁移数据库
async function main() {
  console.log('开始数据库迁移...');

  const migrationClient = postgres(databaseUrl, { max: 1 });
  const db = drizzle(migrationClient);

  console.log('连接到数据库成功！');

  try {
    console.log('应用迁移...');
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('迁移成功！');
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  } finally {
    await migrationClient.end();
    console.log('数据库连接已关闭');
  }

  process.exit(0);
}

main(); 