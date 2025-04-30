/**
 * @description 模块任务API路由
 * @author 郝桃桃
 * @date 2023-10-02
 */

import { NextRequest, NextResponse } from 'next/server';
import { getModuleTasks as dbGetModuleTasks } from '@/lib/services/study-plan-service';

type RouteParams = {
  params: {
    id: string;
  }
};

/**
 * @description 获取模块任务API
 */
export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    // 等待参数解析完成
    const { params } = context;
    
    // Next.js要求在App Router中正确处理params
    if (!params || typeof params !== 'object') {
      console.error('Missing or invalid params object');
      return NextResponse.json(
        { error: '请求参数错误' },
        { status: 400 }
      );
    }
    
    // 安全地访问ID
    const moduleId = String(params.id || '');
    console.log('处理模块任务请求，模块ID:', moduleId);
    
    if (!moduleId) {
      console.error('缺少模块ID参数');
      return NextResponse.json(
        { error: '缺少模块ID' },
        { status: 400 }
      );
    }
    
    console.log(`正在获取模块[${moduleId}]的任务...`);
    const tasks = await dbGetModuleTasks(moduleId);
    console.log(`已获取模块[${moduleId}]的任务:`, tasks.length);
    
    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    console.error('获取模块任务API错误:', error);
    return NextResponse.json(
      { error: '获取模块任务失败', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 