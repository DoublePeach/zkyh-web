/**
 * @description 用户反馈表 - 存储用户对产品的反馈意见
 * @author 郝桃桃
 * @date 2024-05-10
 */
import { pgTable, serial, text, integer, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// 反馈来源枚举
export const feedbackSourceEnum = pgEnum('feedback_source', ['study_plans', 'home', 'study_detail', 'profile']);

// 反馈状态枚举
export const feedbackStatusEnum = pgEnum('feedback_status', ['pending', 'in_progress', 'completed', 'ignored']);

export const feedbacks = pgTable('feedbacks', {
  id: serial('id').primaryKey(),                        // 反馈唯一标识
  userId: integer('user_id').notNull().references(() => users.id), // 用户ID
  satisfaction: integer('satisfaction').notNull(),       // 满意度评分(1-10)
  suggestion: text('suggestion'),                        // 优化建议
  contactPhone: text('contact_phone'),                   // 联系电话
  willContact: boolean('will_contact').default(false),   // 是否愿意被联系
  source: feedbackSourceEnum('source').default('study_plans'), // 反馈来源
  status: feedbackStatusEnum('status').default('pending'), // 处理状态
  adminNotes: text('admin_notes'),                       // 管理员备注
  createdAt: timestamp('created_at').defaultNow().notNull(), // 创建时间
  updatedAt: timestamp('updated_at').defaultNow().notNull(), // 更新时间
});

// 用户操作日志表
export const userActionLogs = pgTable('user_action_logs', {
  id: serial('id').primaryKey(),                        // 日志唯一标识
  userId: integer('user_id').notNull().references(() => users.id), // 用户ID
  action: text('action').notNull(),                      // 用户动作
  page: text('page').notNull(),                          // 页面路径
  details: text('details'),                              // 详细信息(JSON格式)
  userAgent: text('user_agent'),                         // 用户代理
  ipAddress: text('ip_address'),                         // IP地址
  createdAt: timestamp('created_at').defaultNow().notNull(), // 创建时间
});

// 定义反馈与用户的关系
export const feedbacksRelations = relations(feedbacks, ({ one }) => ({
  user: one(users, {
    fields: [feedbacks.userId],
    references: [users.id],
  }),
}));

// 定义用户操作日志与用户的关系
export const userActionLogsRelations = relations(userActionLogs, ({ one }) => ({
  user: one(users, {
    fields: [userActionLogs.userId],
    references: [users.id],
  }),
})); 