/**
 * @description 数据库迁移脚本
 * @author 郝桃桃
 * @date 2024-06-15
 */

const { migrate } = require('drizzle-orm/postgres-js/migrator');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

// 从环境变量获取数据库URL
const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/zkyh_db1';

// 创建PostgreSQL客户端
const migrationClient = postgres(dbUrl, { max: 1 });

// 初始化Drizzle ORM
const db = drizzle(migrationClient);

// 执行迁移
const main = async () => {
  console.log('开始执行数据库迁移...');
  
  try {
    // 执行所有迁移
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('数据库迁移完成');
  } catch (error) {
    console.error('数据库迁移失败:', error);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await migrationClient.end();
  }
};

// 运行迁移
main(); 