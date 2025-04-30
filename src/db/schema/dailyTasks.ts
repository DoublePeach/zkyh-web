import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { studyModules } from './studyModules';

export const dailyTasks = pgTable('daily_tasks', {
  id: serial('id').primaryKey(),
  moduleId: integer('module_id').notNull().references(() => studyModules.id),
  day: integer('day').notNull(), // 计划第几天
  title: text('title').notNull(),
  description: text('description').notNull(),
  learningContent: text('learning_content').notNull(), // 学习内容(富文本)
  estimatedMinutes: integer('estimated_minutes').notNull(), // 预计完成时间(分钟)
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}); 