import { pgTable, serial, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { quizzes } from './quizzes';

export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  quizId: integer('quiz_id').notNull().references(() => quizzes.id),
  type: text('type').notNull(), // 问题类型(single_choice, multiple_choice, text)
  content: text('content').notNull(),
  options: jsonb('options'), // JSON格式存储选项数组
  answer: text('answer').notNull(), // 答案
  explanation: text('explanation').notNull(), // 答案解析
  points: integer('points').notNull(), // 分值
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}); 