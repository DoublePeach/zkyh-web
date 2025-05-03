/**
 * @description 管理员表 - 存储后台管理员账户
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),                          // 管理员ID
  username: text('username').notNull().unique(),          // 用户名
  password: text('password').notNull(),                   // 密码(已加密)
  name: text('name').notNull(),                           // 姓名
  email: text('email').notNull(),                         // 邮箱
  role: text('role').notNull(),                           // 角色(超级管理员/内容管理员等)
  isActive: boolean('is_active').default(true).notNull(), // 是否激活
  lastLogin: timestamp('last_login'),                     // 最后登录时间
  createdAt: timestamp('created_at').defaultNow().notNull(), // 创建时间
  updatedAt: timestamp('updated_at').defaultNow().notNull(), // 更新时间
}); 