/**
 * @description 试题表 - 存储各种题型的试题
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { pgTable, serial, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { testBanks } from './testBanks';
import { knowledgePoints } from './knowledgePoints';

export const quizQuestions = pgTable('quiz_questions', {
  id: serial('id').primaryKey(),                          // 试题ID
  testBankId: integer('test_bank_id').notNull()           // 关联的题库ID
    .references(() => testBanks.id),
  knowledgePointId: integer('knowledge_point_id')         // 关联的知识点ID(可选)
    .references(() => knowledgePoints.id),
  questionType: text('question_type').notNull(),          // 题目类型(单选/多选/判断等)
  content: text('content').notNull(),                     // 题目内容
  options: jsonb('options'),                              // 选项(JSON格式)
  correctAnswer: text('correct_answer').notNull(),        // 正确答案
  explanation: text('explanation').notNull(),             // 解析
  difficulty: integer('difficulty').notNull(),            // 难度级别(1-5)
  createdAt: timestamp('created_at').defaultNow().notNull(), // 创建时间
  updatedAt: timestamp('updated_at').defaultNow().notNull(), // 更新时间
}); 