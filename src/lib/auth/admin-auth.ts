/**
 * @description 管理员身份验证工具
 * @author 郝桃桃
 * @date 2024-05-29
 */
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { adminUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * @description 验证管理员身份并获取管理员信息
 * @returns 验证成功返回管理员信息，失败返回null
 */
export async function getAdminSession() {
  try {
    // cookies()是异步API，需要先await
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session');
    
    if (!adminSession || !adminSession.value) {
      return null;
    }
    
    const adminId = parseInt(adminSession.value);
    if (isNaN(adminId)) {
      return null;
    }
    
    // 从数据库查询管理员信息
    const admin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.id, adminId),
    });
    
    if (!admin || !admin.isActive) {
      return null;
    }
    
    return admin;
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
export function withAdminAuth(handler: Function) {
  return async (req: Request, ...args: any[]) => {
    const admin = await getAdminSession();
    
    if (!admin) {
      return NextResponse.json(
        { success: false, message: '未授权，请重新登录' },
        { status: 401 }
      );
    }
    
    // 注入管理员信息到请求上下文
    const context = { admin };
    
    return handler(req, context, ...args);
  };
} 