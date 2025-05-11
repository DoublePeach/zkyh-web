/**
 * @description 直接执行SQL迁移脚本 - 用于向数据库添加或修改列
 * @author 郝桃桃
 * @date 2024-06-15
 * @details 
 * 此脚本直接执行SQL命令，而不是使用Drizzle ORM的迁移系统。
 * 适用于需要快速修改表结构的情况，特别是当Drizzle迁移失败时。
 * 当前主要功能：
 * 1. 检查并添加study_plans表的plan_data列
 * 2. 检查并添加users表的study_mode列
 * 3. 创建用户反馈和操作日志表
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
    const checkPlanDataColumn = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'study_plans'
      AND column_name = 'plan_data'
    `;
    
    // 如果plan_data列不存在，则添加它
    if (checkPlanDataColumn.length === 0) {
      console.log('plan_data列不存在，正在添加...');
      await sql`ALTER TABLE study_plans ADD COLUMN plan_data jsonb`;
      console.log('成功添加plan_data列');
    } else {
      console.log('plan_data列已存在，无需添加');
    }
    
    // 检查study_mode列是否存在
    const checkStudyModeColumn = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'study_mode'
    `;
    
    // 如果study_mode列不存在，则添加它
    if (checkStudyModeColumn.length === 0) {
      console.log('study_mode列不存在，正在添加...');
      await sql`ALTER TABLE users ADD COLUMN study_mode text DEFAULT 'normal'`;
      console.log('成功添加study_mode列');
    } else {
      console.log('study_mode列已存在，无需添加');
    }
    
    // 检查feedbacks表是否存在
    const checkFeedbacksTable = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'feedbacks'
    `;
    
    // 如果feedbacks表不存在，则创建它
    if (checkFeedbacksTable.length === 0) {
      console.log('feedbacks表不存在，正在创建...');
      
      // 创建反馈来源枚举类型
      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_source') THEN
            CREATE TYPE feedback_source AS ENUM ('study_plans', 'home', 'study_detail', 'profile');
          END IF;
        END
        $$;
      `;
      
      // 创建反馈状态枚举类型
      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_status') THEN
            CREATE TYPE feedback_status AS ENUM ('pending', 'in_progress', 'completed', 'ignored');
          END IF;
        END
        $$;
      `;
      
      // 创建反馈表
      await sql`
        CREATE TABLE IF NOT EXISTS feedbacks (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          satisfaction INTEGER NOT NULL,
          suggestion TEXT,
          contact_phone TEXT,
          will_contact BOOLEAN DEFAULT FALSE,
          source feedback_source DEFAULT 'study_plans',
          status feedback_status DEFAULT 'pending',
          admin_notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `;
      console.log('成功创建feedbacks表');
    } else {
      console.log('feedbacks表已存在，无需创建');
    }
    
    // 检查user_action_logs表是否存在
    const checkLogsTable = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'user_action_logs'
    `;
    
    // 如果user_action_logs表不存在，则创建它
    if (checkLogsTable.length === 0) {
      console.log('user_action_logs表不存在，正在创建...');
      await sql`
        CREATE TABLE IF NOT EXISTS user_action_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          action TEXT NOT NULL,
          page TEXT NOT NULL,
          details TEXT,
          user_agent TEXT,
          ip_address TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `;
      console.log('成功创建user_action_logs表');
    } else {
      console.log('user_action_logs表已存在，无需创建');
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