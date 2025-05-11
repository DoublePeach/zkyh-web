/**
 * @description API route for user registration.
 * @author 郝桃桃
 * @date 2024-07-15
 */
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { z } from 'zod';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';

// 验证schema
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  profession: z.string(),
  currentTitle: z.string(),
  targetTitle: z.string(),
});

/**
 * @description Hashes a password using SHA256.
 * @param {string} password - The password to hash.
 * @returns {string} - The hashed password.
 * @warning This uses SHA256 without a salt, which is not recommended for production. Consider using bcrypt or Argon2.
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * @description Handles new user registration requests.
 * @param {Request} req - The incoming HTTP request containing user registration data.
 * @returns {Promise<NextResponse>} A JSON response indicating success or failure of registration.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 验证请求数据
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: '验证失败', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { username, password, profession, currentTitle, targetTitle } = validationResult.data;
    
    // 检查用户名是否已存在
    const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
    
    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, error: '用户名已存在' }, 
        { status: 409 } // 使用 409 Conflict 状态码
      );
    }
    
    // 创建用户
    const passwordHash = hashPassword(password);
    
    const [newUser] = await db.insert(users).values({
      username,
      passwordHash,
      profession,
      currentTitle,
      targetTitle,
    }).returning();
    
    // 返回用户信息（不包含密码）
    return NextResponse.json(
      {
        success: true, // 添加 success 标志
        message: '注册成功',
        data: { // 将 user 嵌套在 data 中
          id: newUser.id,
          username: newUser.username,
          profession: newUser.profession,
          currentTitle: newUser.currentTitle,
          targetTitle: newUser.targetTitle,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('注册失败:', error);
    return NextResponse.json(
      { success: false, error: '注册失败，请稍后再试' }, 
      { status: 500 }
    );
  }
} 