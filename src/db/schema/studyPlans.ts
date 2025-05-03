/**
 * @description 学习计划表 - 存储用户的学习计划
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { pgTable, serial, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const studyPlans = pgTable('study_plans', {
  id: serial('id').primaryKey(),                          // 学习计划ID
  userId: integer('user_id').notNull()                    // 关联的用户ID
    .references(() => users.id),
  title: text('title').notNull(),                         // 计划标题
  overview: text('overview').notNull(),                   // 计划概述
  profession: text('profession').notNull(),               // 职业类别
  targetTitle: text('target_title').notNull(),            // 目标职称
  totalDays: integer('total_days').notNull(),             // 总天数
  startDate: timestamp('start_date').notNull(),           // 开始日期
  endDate: timestamp('end_date').notNull(),               // 结束日期
  subjectIds: integer('subject_ids').array(),             // 关联的考试科目ID数组
  disciplineIds: integer('discipline_ids').array(),       // 关联的护理学科ID数组
  examYear: integer('exam_year'),                         // 考试年份
  customSettings: jsonb('custom_settings'),               // 自定义学习设置
  isActive: boolean('is_active').default(true).notNull(), // 是否激活
  createdAt: timestamp('created_at').defaultNow().notNull(), // 创建时间
  updatedAt: timestamp('updated_at').defaultNow().notNull(), // 更新时间
}); 