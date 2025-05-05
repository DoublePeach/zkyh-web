/**
 * @description 优化study_plans表结构的专用脚本
 * @author 郝桃桃
 * @date 2024-06-15
 * @details 
 * 此脚本用于重构study_plans表，移除不必要的冗余列。
 * 在执行之前，请确保已备份重要数据。
 */
import 'dotenv/config';
import postgres from 'postgres';

// 数据库连接字符串
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:@localhost:5432/zkyh_db1';

// 执行SQL迁移
async function main() {
  console.log('开始优化study_plans表结构...');
  
  // 创建数据库客户端
  const sql = postgres(connectionString, { max: 1 });
  
  try {
    // 检查表存在性
    const checkTableResult = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'study_plans'
      );
    `;
    
    if (!checkTableResult[0].exists) {
      console.error('study_plans表不存在');
      process.exit(1);
    }
    
    console.log('备份表结构和数据...');
    // 创建备份表（可选）
    try {
      await sql`CREATE TABLE IF NOT EXISTS study_plans_backup AS SELECT * FROM study_plans`;
      console.log('备份表创建成功');
    } catch (backupError) {
      console.warn('创建备份表失败，继续执行:', backupError);
    }
    
    // 定义要删除的冗余列
    const columnsToRemove = [
      'overview',
      'profession',
      'target_title', 
      'subject_ids',
      'discipline_ids',
      'custom_settings'
    ];
    
    // 检查并删除每一列
    for (const column of columnsToRemove) {
      const checkColumnResult = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'study_plans'
        AND column_name = ${column}
      `;
      
      if (checkColumnResult.length > 0) {
        console.log(`删除列 ${column}...`);
        await sql`ALTER TABLE study_plans DROP COLUMN ${sql(column)}`;
        console.log(`成功删除列 ${column}`);
      } else {
        console.log(`列 ${column} 不存在，跳过`);
      }
    }
    
    // 确保plan_data列有默认值
    console.log('为plan_data列设置默认值...');
    await sql`ALTER TABLE study_plans ALTER COLUMN plan_data SET DEFAULT '{}'::jsonb`;
    
    console.log('表结构优化成功');
  } catch (error) {
    console.error('优化过程中发生错误:', error);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await sql.end();
    console.log('SQL优化完成');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('优化脚本执行失败:', error);
  process.exit(1);
}); 