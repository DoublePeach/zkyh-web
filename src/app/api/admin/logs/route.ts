/**
 * @description 管理员日志API - 获取用户操作日志
 * @author 郝桃桃
 * @date 2024-05-10
 */

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { userActionLogs } from '@/db/schema/feedbacks';
import { eq, desc, sql, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const userId = searchParams.get('userId') ? parseInt(searchParams.get('userId') || '0') : undefined;
    
    // 准备条件
    const conditions = [];
    if (userId && !isNaN(userId)) {
      conditions.push(eq(userActionLogs.userId, userId));
    }
    
    // 执行查询，获取分页数据
    const items = await db.select()
      .from(userActionLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(userActionLogs.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    
    // 获取总记录数
    const countResult = await db.select({
      count: sql`count(*)`.mapWith(Number)
    }).from(userActionLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const total = countResult[0].count || 0;
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('获取用户操作日志失败:', error);
    return new Response(JSON.stringify(
      { success: false, error: error.message || '获取用户操作日志失败' }
    ), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 