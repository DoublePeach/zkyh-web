/**
 * @description 直接执行SQL迁移脚本 - 用于向数据库添加或修改列
 * @author 郝桃桃
 * @date 2024-06-15
 * @details 
 * 此脚本直接执行SQL命令，而不是使用Drizzle ORM的迁移系统。
 * 适用于需要快速修改表结构的情况，特别是当Drizzle迁移失败时。
 * 当前主要功能：检查并添加study_plans表的plan_data列。
 */
import 'dotenv/config';
import postgres from 'postgres';

// 数据库连接字符串
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:@localhost:5432/zkyh_db1';

// 执行SQL迁移
async function main() {
  console.log('开始手动执行SQL迁移...');
  
  // 创建数据库客户端
  const sql = postgres(connectionString, { max: 1 });
  
  try {
    // 检查plan_data列是否存在
    const checkColumnResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'study_plans'
      AND column_name = 'plan_data'
    `;
    
    // 如果列不存在，则添加它
    if (checkColumnResult.length === 0) {
      console.log('plan_data列不存在，正在添加...');
      await sql`ALTER TABLE study_plans ADD COLUMN plan_data jsonb`;
      console.log('成功添加plan_data列');
    } else {
      console.log('plan_data列已存在，无需添加');
    }
  } catch (error) {
    console.error('迁移过程中发生错误:', error);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await sql.end();
    console.log('SQL迁移完成');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('迁移脚本执行失败:', error);
  process.exit(1);
}); 