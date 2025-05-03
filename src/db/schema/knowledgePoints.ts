/**
 * @description 知识点表 - 存储每个章节下的知识点
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { pgTable, serial, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { chapters } from './chapters';
import { examSubjects } from './examSubjects';

export const knowledgePoints = pgTable('knowledge_points', {
  id: serial('id').primaryKey(),                          // 知识点ID
  chapterId: integer('chapter_id').notNull()              // 关联的章节ID
    .references(() => chapters.id),
  subjectId: integer('subject_id').notNull()              // 关联的考试科目ID
    .references(() => examSubjects.id),
  title: text('title').notNull(),                         // 知识点标题
  content: text('content').notNull(),                     // 知识点内容
  difficulty: integer('difficulty').notNull(),            // 难度级别(1-5)
  importance: integer('importance').notNull(),            // 重要程度(1-5)
  keywords: text('keywords').array(),                     // 关键词数组
  tags: jsonb('tags'),                                    // 标签(JSON格式)
  createdAt: timestamp('created_at').defaultNow().notNull(), // 创建时间
  updatedAt: timestamp('updated_at').defaultNow().notNull(), // 更新时间
}); 