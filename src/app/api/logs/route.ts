/**
 * @description 用户操作日志API路由 - 处理日志记录请求
 * @author 郝桃桃
 * @date 2024-05-10
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userActionLogs } from '@/db/schema/feedbacks';
import { headers } from 'next/headers';

/**
 * 记录用户操作 - 服务端实现
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, action, page, details } = await request.json();
    
    // 验证必填参数
    if (!userId || !action || !page) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    // 获取请求头信息 - 在 Next.js 15.3.1 中需要await
    const headersList = await headers();
    // 现在可以安全地使用get方法
    const userAgent = headersList.get('user-agent') || '';
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     '127.0.0.1';
    
    // 插入操作日志
    await db.insert(userActionLogs).values({
      userId,
      action,
      page,
      details: details ? JSON.stringify(details) : null,
      userAgent,
      ipAddress,
      createdAt: new Date()
    });
    
    return new Response(JSON.stringify({
      success: true
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('记录用户操作失败:', error);
    
    // 即使记录失败也返回成功，不影响用户体验
    return new Response(JSON.stringify({
      success: true
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 