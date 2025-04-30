import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { studyPlans } from './studyPlans';

export const studyModules = pgTable('study_modules', {
  id: serial('id').primaryKey(),
  planId: integer('plan_id').notNull().references(() => studyPlans.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  order: integer('order').notNull(),
  durationDays: integer('duration_days').notNull(),
  importance: integer('importance').notNull(), // 重要性评分(1-10)
  difficulty: integer('difficulty').notNull(), // 难度评分(1-10)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}); 