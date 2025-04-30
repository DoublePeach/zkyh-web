import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
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
        { error: '验证失败', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { username, password } = validationResult.data;
    
    // 查找用户
    const user = await db.select().from(users).where(eq(users.username, username)).limit(1);
    
    if (user.length === 0) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }
    
    // 验证密码
    const passwordHash = hashPassword(password);
    if (user[0].passwordHash !== passwordHash) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }
    
    // 登录成功，返回用户信息（不包含密码）
    return NextResponse.json({
      message: '登录成功',
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
      { error: '登录失败，请稍后再试' },
      { status: 500 }
    );
  }
} 