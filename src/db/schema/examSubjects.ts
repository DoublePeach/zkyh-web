/**
 * @description 考试科目表 - 存储护理职称考试的四个科目
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const examSubjects = pgTable('exam_subjects', {
  id: serial('id').primaryKey(),                          // 科目ID
  name: text('name').notNull(),                           // 科目名称，如"专业知识"、"专业实践能力"等
  description: text('description').notNull(),             // 科目描述
  weight: text('weight').notNull(),                       // 考试权重
  createdAt: timestamp('created_at').defaultNow().notNull(), // 创建时间
  updatedAt: timestamp('updated_at').defaultNow().notNull(), // 更新时间
}); 