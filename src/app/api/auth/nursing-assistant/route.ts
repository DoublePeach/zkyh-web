/**
 * @description 护理助手APP用户集成 - 无缝登录接口
 * @author 郝桃桃
 * @date 2024-09-28
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// 根据环境选择真实或模拟的护理助手连接
let nursingAssistantService;
if (process.env.NODE_ENV === 'production') {
  // 生产环境使用真实MySQL连接
  nursingAssistantService = require('@/lib/mysql-connection');
} else {
  // 开发环境使用模拟数据
  nursingAssistantService = require('@/lib/mock-mysql-connection');
}

const { validateNursingAssistantUser, getNursingAssistantUser } = nursingAssistantService;

// 验证schema
const nursingAssistantAuthSchema = z.object({
  userId: z.string().min(1, '请提供用户ID'),
  timestamp: z.string().optional(),  // 可选时间戳用于验证请求有效性
  signature: z.string().optional(),  // 可选签名用于验证请求有效性
});

/**
 * @description 处理来自护理助手APP的登录请求
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 验证请求数据
    const validationResult = nursingAssistantAuthSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: '验证失败', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { userId } = validationResult.data;
    
    // 验证护理助手用户是否有效
    const isValidUser = await validateNursingAssistantUser(userId);
    if (!isValidUser) {
      return NextResponse.json(
        { success: false, error: '未找到有效用户' },
        { status: 404 }
      );
    }
    
    // 获取护理助手用户信息
    const nursingAssistantUser = await getNursingAssistantUser(userId);
    
    // 查找是否已存在关联的本站用户
    const existingUser = await db.query.users.findFirst({
      where: eq(users.nursingAssistantUserId, userId),
    });
    
    // 用户信息
    let userData;
    
    if (existingUser) {
      // 更新用户最后活动时间
      await db
        .update(users)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id));
      
      userData = {
        id: existingUser.id,
        username: existingUser.username,
        profession: existingUser.profession,
        currentTitle: existingUser.currentTitle,
        targetTitle: existingUser.targetTitle,
      };
    } else {
      // 创建新用户 - 使用护理助手用户信息初始化
      // 注意：这里使用默认数据创建，后续可提示用户补充完整信息
      
      // 生成随机密码，实际用户不需要知道，因为后续使用的是APP无缝登录
      const randomPassword = Math.random().toString(36).slice(-10);
      const passwordHash = crypto.createHash('sha256').update(randomPassword).digest('hex');
      
      // 确保有一个有效的用户名，结合护理助手的数据
      const userName = nursingAssistantUser?.name || `用户${userId.slice(-4)}`;
      
      // 创建新用户
      const [newUser] = await db.insert(users).values({
        username: `护理助手_${userName}`,
        passwordHash,
        profession: '护理', // 默认为护理专业
        currentTitle: nursingAssistantUser?.title || '护士', // 尝试使用护理助手的职称，否则默认为护士
        targetTitle: '主管护师', // 默认目标职称
        nursingAssistantUserId: userId,
      }).returning();
      
      userData = {
        id: newUser.id,
        username: newUser.username,
        profession: newUser.profession,
        currentTitle: newUser.currentTitle,
        targetTitle: newUser.targetTitle,
      };
    }
    
    // 设置登录会话cookie
    const response = NextResponse.json({
      success: true,
      message: '登录成功',
      user: userData
    });
    
    // 在响应中设置cookie
    response.cookies.set("session", String(userData.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7天过期
    });
    
    return response;
  } catch (error) {
    console.error('护理助手登录失败:', error);
    return NextResponse.json(
      { success: false, error: '登录处理失败，请稍后再试' },
      { status: 500 }
    );
  }
} 