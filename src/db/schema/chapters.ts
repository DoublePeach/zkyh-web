/**
 * @description 章节表 - 存储每个学科下的章节
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { nursingDisciplines } from './nursingDisciplines';

export const chapters = pgTable('chapters', {
  id: serial('id').primaryKey(),                          // 章节ID
  disciplineId: integer('discipline_id').notNull()        // 关联的护理学科ID
    .references(() => nursingDisciplines.id),
  name: text('name').notNull(),                           // 章节名称
  description: text('description').notNull(),             // 章节描述
  orderIndex: integer('order_index').notNull(),           // 章节顺序
  createdAt: timestamp('created_at').defaultNow().notNull(), // 创建时间
  updatedAt: timestamp('updated_at').defaultNow().notNull(), // 更新时间
});

// 定义与其他表的关系
export const chaptersRelations = relations(chapters, ({ one }) => ({
  discipline: one(nursingDisciplines, {
    fields: [chapters.disciplineId],
    references: [nursingDisciplines.id],
  }),
})); 