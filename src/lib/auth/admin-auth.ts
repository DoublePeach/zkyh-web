/**
 * @description 管理员身份验证工具
 * @author 郝桃桃
 * @date 2024-06-17
 */
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { adminUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { RouteParamsContext } from '../utils/route-utils';

/**
 * 管理员用户类型
 */
export interface AdminUser {
  id: number;
  username: string;
  name: string;
  role: string;
  isActive: boolean;
  [key: string]: unknown;
}

/**
 * 路由处理函数类型
 */
export type RouteHandler<T extends Record<string, string> = Record<string, string>> = (
  req: NextRequest, 
  context: RouteParamsContext<T> & { admin?: AdminUser }
) => Promise<Response>;

/**
 * @description 验证管理员身份并获取管理员信息
 * @returns 验证成功返回管理员信息，失败返回null
 */
export async function getAdminSession(): Promise<AdminUser | null> {
  try {
    // Next.js 15中cookies()是异步API
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session');
    
    if (!adminSession || !adminSession.value) {
      console.log('[AUTH] 未找到管理员会话cookie');
      return null;
    }
    
    const adminId = parseInt(adminSession.value);
    if (isNaN(adminId)) {
      console.log('[AUTH] 管理员ID无效:', adminSession.value);
      return null;
    }
    
    // 从数据库查询管理员信息
    const admin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.id, adminId),
    });
    
    if (!admin) {
      console.log('[AUTH] 未找到管理员用户:', adminId);
      return null;
    }
    
    if (!admin.isActive) {
      console.log('[AUTH] 管理员账户未激活:', adminId);
      return null;
    }
    
    return admin as AdminUser;
  } catch (error) {
    console.error('获取管理员会话失败:', error);
    return null;
  }
}

/**
 * @description API路由中间件，用于验证管理员身份
 * @param handler API请求处理函数
 * @returns 请求处理结果
 */
export function withAdminAuth<T extends Record<string, string> = Record<string, string>>(
  handler: RouteHandler<T>
) {
  return async (req: NextRequest, context: RouteParamsContext<T>): Promise<Response> => {
    const admin = await getAdminSession();
    
    if (!admin) {
      return NextResponse.json(
        { success: false, message: '未授权，请重新登录' },
        { status: 401 }
      );
    }
    
    // 注入管理员信息到请求上下文
    const contextWithAdmin = { ...context, admin };
    
    return handler(req, contextWithAdmin);
  };
} 