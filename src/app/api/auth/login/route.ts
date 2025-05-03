import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, adminUsers } from '@/db/schema';
import { z } from 'zod';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';

// 验证schema
const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

// 简单的密码哈希函数 (与注册时使用的相同)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 验证请求数据
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: '验证失败', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { username, password } = validationResult.data;
    
    // 首先尝试查找管理员用户
    const adminUser = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.username, username),
    });
    
    // 如果找到管理员账户
    if (adminUser) {
      // 检查管理员账户是否被禁用
      if (!adminUser.isActive) {
        return NextResponse.json(
          { success: false, error: '账户已被禁用，请联系系统管理员' },
          { status: 403 }
        );
      }
      
      // 验证管理员密码 (实际项目中应该使用加密比较)
      const passwordMatch = adminUser.password === password;
      
      if (!passwordMatch) {
        return NextResponse.json(
          { success: false, error: '用户名或密码错误' },
          { status: 401 }
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
      
      // 设置管理员登录会话cookie
      const cookieStore = cookies();
      cookieStore.set("admin_session", String(adminUser.id), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        // 2小时过期
        maxAge: 60 * 60 * 2,
      });
      
      // 返回管理员登录成功响应，并标记身份为管理员
      return NextResponse.json({
        success: true,
        message: '登录成功',
        isAdmin: true,
        user: {
          id: adminUser.id,
          username: adminUser.username,
          name: adminUser.name,
          role: adminUser.role,
        }
      });
    }
    
    // 如果不是管理员，尝试查找普通用户
    const user = await db.select().from(users).where(eq(users.username, username)).limit(1);
    
    if (user.length === 0) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      );
    }
    
    // 验证密码
    const passwordHash = hashPassword(password);
    if (user[0].passwordHash !== passwordHash) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      );
    }
    
    // 普通用户登录成功，返回用户信息（不包含密码）
    return NextResponse.json({
      success: true,
      message: '登录成功',
      isAdmin: false,
      user: {
        id: user[0].id,
        username: user[0].username,
        profession: user[0].profession,
        currentTitle: user[0].currentTitle,
        targetTitle: user[0].targetTitle,
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { success: false, error: '登录失败，请稍后再试' },
      { status: 500 }
    );
  }
} 