/**
 * @description 用户表 - 存储平台注册用户
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),                        // 用户唯一标识
  username: text('username').notNull(),                 // 用户名
  passwordHash: text('password_hash').notNull(),        // 密码哈希
  profession: text('profession').notNull(),             // 专业类别(医疗/护理/药技)
  currentTitle: text('current_title').notNull(),        // 当前职称
  targetTitle: text('target_title').notNull(),          // 目标职称
  workYears: integer('work_years'),                     // 工作年限
  studyTimePerDay: integer('study_time_per_day'),       // 每日学习时间(小时)
  examDate: timestamp('exam_date'),                     // 目标考试日期
  nursingAssistantUserId: text('nursing_assistant_user_id'), // 护理助手APP用户ID
  createdAt: timestamp('created_at').defaultNow().notNull(), // 创建时间
  updatedAt: timestamp('updated_at').defaultNow().notNull(), // 更新时间
}); 