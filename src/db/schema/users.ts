import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull(),
  passwordHash: text('password_hash').notNull(),
  profession: text('profession').notNull(), // 专业类别(医疗/护理/药技)
  currentTitle: text('current_title').notNull(), // 当前职称
  targetTitle: text('target_title').notNull(), // 目标职称
  workYears: integer('work_years'), // 工作年限
  studyTimePerDay: integer('study_time_per_day'), // 每日学习时间(小时)
  examDate: timestamp('exam_date'), // 目标考试日期
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}); 