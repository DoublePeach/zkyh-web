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
      console.log('[AUTH] 未找到管理员会话cookie，环境:', process.env.NODE_ENV);
      return null;
    }
    
    const adminId = parseInt(adminSession.value);
    if (isNaN(adminId)) {
      console.log('[AUTH] 管理员ID无效:', adminSession.value, '环境:', process.env.NODE_ENV);
      return null;
    }
    
    // 从数据库查询管理员信息
    const admin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.id, adminId),
    });
    
    if (!admin) {
      console.log('[AUTH] 未找到管理员用户:', adminId, '环境:', process.env.NODE_ENV);
      return null;
    }
    
    if (!admin.isActive) {
      console.log('[AUTH] 管理员账户未激活:', adminId, '环境:', process.env.NODE_ENV);
      return null;
    }
    
    console.log('[AUTH] 成功获取管理员会话:', adminId, '环境:', process.env.NODE_ENV);
    return admin as AdminUser;
  } catch (error) {
    console.error('获取管理员会话失败:', error, '环境:', process.env.NODE_ENV);
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
      console.log(`[AUTH] withAdminAuth 拒绝请求: 未找到有效的管理员会话, 请求路径: ${req.nextUrl.pathname}, 环境: ${process.env.NODE_ENV}`);
      
      // 如果是API请求，返回JSON响应
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, message: '未授权，请重新登录' },
          { status: 401 }
        );
      }
      
      // 如果是页面请求，重定向到登录页
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('redirect', encodeURIComponent(req.nextUrl.pathname));
      return NextResponse.redirect(loginUrl);
    }
    
    console.log(`[AUTH] withAdminAuth 授权通过: 管理员ID: ${admin.id}, 用户名: ${admin.username}, 请求路径: ${req.nextUrl.pathname}`);
    
    // 注入管理员信息到请求上下文
    const contextWithAdmin = { ...context, admin };
    
    try {
      return await handler(req, contextWithAdmin);
    } catch (error) {
      console.error(`[AUTH] 处理请求时出错:`, error);
      return NextResponse.json(
        { success: false, message: '服务器错误，请稍后再试' },
        { status: 500 }
      );
    }
  };
} 