/**
 * @description 题库表 - 存储不同类型的题库
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { examSubjects } from './examSubjects';

export const testBanks = pgTable('test_banks', {
  id: serial('id').primaryKey(),                          // 题库ID
  subjectId: integer('subject_id').notNull()              // 关联的考试科目ID
    .references(() => examSubjects.id),
  name: text('name').notNull(),                           // 题库名称
  description: text('description').notNull(),             // 题库描述
  type: text('type').notNull(),                           // 题库类型(模拟题/历年真题/练习题)
  year: integer('year'),                                  // 适用年份(真题适用)
  totalQuestions: integer('total_questions').notNull(),   // 题目总数
  createdAt: timestamp('created_at').defaultNow().notNull(), // 创建时间
  updatedAt: timestamp('updated_at').defaultNow().notNull(), // 更新时间
}); 