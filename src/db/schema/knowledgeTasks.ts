/**
 * @description 知识任务表 - 存储用户学习任务与知识点的关联
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { pgTable, serial, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { knowledgePoints } from './knowledgePoints';
import { dailyTasks } from './dailyTasks';

export const knowledgeTasks = pgTable('knowledge_tasks', {
  id: serial('id').primaryKey(),                          // 知识任务ID
  dailyTaskId: integer('daily_task_id').notNull()         // 关联的每日任务ID
    .references(() => dailyTasks.id),
  knowledgePointId: integer('knowledge_point_id').notNull() // 关联的知识点ID
    .references(() => knowledgePoints.id),
  isCompleted: boolean('is_completed').default(false).notNull(), // 是否已完成
  completedAt: timestamp('completed_at'),                 // 完成时间
  createdAt: timestamp('created_at').defaultNow().notNull(), // 创建时间
  updatedAt: timestamp('updated_at').defaultNow().notNull(), // 更新时间
}); 