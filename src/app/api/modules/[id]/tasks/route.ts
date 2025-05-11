/**
 * @description 模块任务API路由
 * @author 郝桃桃
 * @date 2023-10-02
 */

import { NextRequest, NextResponse } from 'next/server';
import { getModuleTasks as dbGetModuleTasks } from '@/lib/services/study-plan-service';

type RouteParams = {
  params: Promise<{
    id: string;
  }>
};

/**
 * @description 获取模块任务API
 */
export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    // 在Next.js 15中，params需要先await
    const params = await context.params;
    
    // 安全地访问ID
    const moduleId = String(params.id || '');
    console.log('处理模块任务请求，模块ID:', moduleId);
    
    if (!moduleId) {
      console.error('缺少模块ID参数');
      return new Response(JSON.stringify({ error: '缺少模块ID' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
    }
    
    console.log(`正在获取模块[${moduleId}]的任务...`);
    const response = await dbGetModuleTasks(moduleId);
    
    if (!response.success) {
      console.error(`获取模块[${moduleId}]的任务失败:`, response.error);
      return NextResponse.json(
        { error: '获取模块任务失败', message: response.error },
        { status: 500 }
      );
    }
    
    console.log(`已获取模块[${moduleId}]的任务:`, response.data ? response.data.length : 0);
    
    return new Response(JSON.stringify({ tasks: response.data || [] }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('获取模块任务API错误:', error);
    return NextResponse.json(
      { error: '获取模块任务失败', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 