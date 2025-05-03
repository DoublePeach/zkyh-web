/**
 * @description 护理学科表 - 存储六个护理学科
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const nursingDisciplines = pgTable('nursing_disciplines', {
  id: serial('id').primaryKey(),                          // 学科ID
  name: text('name').notNull(),                           // 学科名称，如"内科护理"、"外科护理"等
  description: text('description').notNull(),             // 学科描述
  imageUrl: text('image_url'),                            // 学科图标或图片URL
  createdAt: timestamp('created_at').defaultNow().notNull(), // 创建时间
  updatedAt: timestamp('updated_at').defaultNow().notNull(), // 更新时间
}); 