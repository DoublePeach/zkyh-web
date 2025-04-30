import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { dailyTasks } from './dailyTasks';

export const quizzes = pgTable('quizzes', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').notNull().references(() => dailyTasks.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  passScore: integer('pass_score').notNull(),
  timeLimit: integer('time_limit'), // 时间限制(分钟)
  attempts: integer('attempts').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}); 