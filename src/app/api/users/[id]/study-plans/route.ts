/**
 * @description 用户备考规划列表API路由
 * @author 郝桃桃
 * @date 2023-10-02
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserStudyPlans as dbGetUserStudyPlans } from '@/lib/services/study-plan-service';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * @description 获取用户备考规划列表API
 */
export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    // 在Next.js 15中，params需要先await
    const params = await context.params;
    const userId = params.id;
    console.log('处理用户备考规划请求，用户ID:', userId);
    
    if (!userId) {
      console.error('缺少用户ID参数');
      return new Response(JSON.stringify({ error: '缺少用户ID' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
    }
    
    const response = await dbGetUserStudyPlans(userId);
    
    if (!response.success) {
      console.error('获取用户备考规划失败:', response.error);
      return NextResponse.json(
        { error: '获取用户备考规划失败', message: response.error },
        { status: 500 }
      );
    }
    
    console.log(`获取到${response.data ? response.data.length : 0}个备考规划`);
    
    return new Response(JSON.stringify({ plans: response.data || [] }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('获取用户备考规划列表API错误:', error);
    return NextResponse.json(
      { error: '获取用户备考规划列表失败', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
