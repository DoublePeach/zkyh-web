/**
 * @description 护理助手APP用户集成 - 无缝登录接口。允许通过护理助手APP的用户ID登录或自动注册到本系统。
 * @author 郝桃桃
 * @date 2024-07-15
 */
import { NextResponse } from 'next/server';
// import { cookies } from 'next/headers'; // Removed unused import
import { z } from 'zod';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import jwt from 'jsonwebtoken'; // 新增导入 for JWT

/**
 * @interface NursingAssistantUserService
 * @description 定义了与护理助手用户系统交互的服务所需的方法。
 */
interface NursingAssistantUserService {
  /**
   * @description 根据用户ID从护理助手系统获取用户信息。
   * @param {string} userId - 护理助手系统的用户ID。
   * @returns {Promise<any>} - 包含用户信息的对象，建议定义更具体的类型。
   */
  getNursingAssistantUser: (userId: string) => Promise<any>; 
  /**
   * @description 验证护理助手系统中的用户ID是否有效。
   * @param {string} userId - 护理助手系统的用户ID。
   * @returns {Promise<boolean>} - 如果用户有效则返回true，否则返回false。
   */
  validateNursingAssistantUser: (userId: string) => Promise<boolean>;
}

// 根据环境选择真实或模拟的护理助手连接
let nursingAssistantServiceModule: NursingAssistantUserService | undefined;

/**
 * @description 动态加载护理助手用户服务模块。
 *              在生产环境加载真实的MySQL连接服务，在其他环境加载模拟服务。
 * @returns {Promise<NursingAssistantUserService>} NursingAssistantUserService的实例。
 * @throws {Error} 如果服务模块加载失败。
 */
async function loadNursingAssistantService(): Promise<NursingAssistantUserService> {
  if (nursingAssistantServiceModule) {
    return nursingAssistantServiceModule;
  }
  if (process.env.NODE_ENV === 'production') {
    // 生产环境使用真实MySQL连接
    nursingAssistantServiceModule = await import('@/lib/mysql-connection');
  } else {
    // 开发环境使用模拟数据
    nursingAssistantServiceModule = await import('@/lib/mock-mysql-connection');
  }
  if (!nursingAssistantServiceModule) {
    console.error("Failed to load NursingAssistantUserService module dynamically."); // 添加日志
    throw new Error("Failed to load NursingAssistantUserService");
  }
  return nursingAssistantServiceModule;
}

// 验证schema
const nursingAssistantAuthSchema = z.object({
  userId: z.string().min(1, '请提供用户ID'),
  // 重要：以下字段当前未用于请求签名验证，建议在生产环境中实现并强制使用签名以增强安全性。
  timestamp: z.string().optional(),
  signature: z.string().optional(), 
});

/**
 * @description 处理来自护理助手APP的登录请求。
 *              通过护理助手用户ID验证用户，如果用户在本系统已存在则登录，否则自动注册新用户。
 * @param {Request} req - HTTP请求对象，包含护理助手用户ID等信息。
 * @returns {Promise<NextResponse>} JSON响应，包含登录结果和用户信息，或错误信息。
 * @todo 强烈建议实现并强制使用请求体中的timestamp和signature字段进行签名验证，以防请求伪造。
 */
export async function POST(req: Request) {
  try {
    const nursingAssistantService = await loadNursingAssistantService();
    const { validateNursingAssistantUser, getNursingAssistantUser } = nursingAssistantService;

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
    
    // 为用户创建JWT (统一会话管理)
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET 未配置，无法为护理助手用户生成token');
      return NextResponse.json(
        { success: false, error: '服务器内部错误，无法完成登录' },
        { status: 500 }
      );
    }
    const tokenPayload = {
      userId: userData.id,
      username: userData.username,
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: '7d', // Token 有效期7天 (与原maxAge一致)
    });

    // 设置登录会话cookie
    const response = NextResponse.json({
      success: true,
      message: '登录成功',
      user: userData
    });
    
    // 在响应中设置cookie (统一cookie名称和内容)
    response.cookies.set("session_token", token, {
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