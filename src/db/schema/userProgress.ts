import { pgTable, serial, timestamp, integer } from 'drizzle-orm/pg-core';
import { users } from './users';
import { dailyTasks } from './dailyTasks';

export const userProgress = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  taskId: integer('task_id').notNull().references(() => dailyTasks.id),
  progress: integer('progress').default(0).notNull(), // 进度百分比(0-100)
  timeSpent: integer('time_spent').default(0).notNull(), // 花费时间(分钟)
  lastAccessedAt: timestamp('last_accessed_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}); 