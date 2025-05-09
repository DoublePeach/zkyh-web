/**
 * @description 学习计划表 - 存储用户的学习计划
 * @author 郝桃桃
 * @date 2024-06-15
 */
import { pgTable, serial, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const studyPlans = pgTable('study_plans', {
  id: serial('id').primaryKey(),                          // 学习计划ID
  userId: integer('user_id')                              // 关联的用户ID，允许为空方便测试
    .references(() => users.id),
  title: text('title').notNull(),                         // 计划标题
  examYear: integer('exam_year'),                         // 考试年份
  startDate: timestamp('start_date').notNull(),           // 开始日期
  endDate: timestamp('end_date').notNull(),               // 结束日期
  totalDays: integer('total_days').notNull(),             // 总天数
  
  // 存储AI生成的完整备考规划JSON数据
  // 包含overview(总览)、phases(基础、强化、冲刺三阶段)和dailyPlans(每日学习计划)
  planData: jsonb('plan_data'),                           
  
  isActive: boolean('is_active').default(true).notNull(), // 是否激活
  createdAt: timestamp('created_at').defaultNow().notNull(), // 创建时间
  updatedAt: timestamp('updated_at').defaultNow().notNull(), // 更新时间
}); 