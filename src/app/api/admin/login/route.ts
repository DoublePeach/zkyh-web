/**
 * @description 管理员登录API
 * @author 郝桃桃
 * @date 2024-06-17
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { adminUsers } from '@/db/schema';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

// 验证schema
const adminLoginSchema = z.object({
  username: z.string().min(1, '请输入管理员用户名'),
  password: z.string().min(1, '请输入密码'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 验证请求数据
    const validationResult = adminLoginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: '验证失败', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { username, password } = validationResult.data;
    
    // 查找管理员用户
    const adminUser = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.username, username),
    });
    
    // 如果找不到管理员账户或密码不匹配
    if (!adminUser || adminUser.password !== password) {
      console.log(`[管理员登录] 登录失败，用户名: ${username}`);
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      );
    }
    
    // 检查管理员账户是否被禁用
    if (!adminUser.isActive) {
      console.log(`[管理员登录] 禁用账户尝试登录: ${username}`);
      return NextResponse.json(
        { success: false, error: '账户已被禁用，请联系系统管理员' },
        { status: 403 }
      );
    }
      
    // 更新管理员最后登录时间
    await db
      .update(adminUsers)
      .set({
        lastLogin: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, adminUser.id));
    
    // 设置管理员登录会话cookie - Next.js 15中cookies()是异步API
    const cookieStore = await cookies();
    cookieStore.set("admin_session", String(adminUser.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // 设置为8小时过期，提高会话持久性
      maxAge: 60 * 60 * 8,
      // 确保在生产环境中也能正确设置Domain
      domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN || undefined : undefined,
    });
    
    console.log(`[管理员登录] 成功: ${username}, 会话时长: 8小时, 环境: ${process.env.NODE_ENV}`);
    
    // 返回管理员登录成功响应
    return NextResponse.json({
      success: true,
      message: '管理员登录成功',
      user: {
        id: adminUser.id,
        username: adminUser.username,
        name: adminUser.name,
        role: adminUser.role,
      }
    });
  } catch (error) {
    console.error('[管理员登录] 错误:', error);
    return NextResponse.json(
      { success: false, error: '登录失败，请稍后再试' },
      { status: 500 }
    );
  }
} 