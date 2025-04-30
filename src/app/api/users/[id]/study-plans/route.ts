/**
 * @description 用户备考规划列表API路由
 * @author 郝桃桃
 * @date 2023-10-02
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserStudyPlans as dbGetUserStudyPlans } from '@/lib/services/study-plan-service';

type RouteParams = {
  params: {
    id: string;
  }
};

/**
 * @description 获取用户备考规划列表API
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Next.js要求在App Router中正确处理params
    if (!params || typeof params !== 'object') {
      console.error('Missing or invalid params object');
      return NextResponse.json(
        { error: '请求参数错误' },
        { status: 400 }
      );
    }
    
    const userId = params.id;
    console.log('处理用户备考规划请求，用户ID:', userId);
    
    if (!userId) {
      console.error('缺少用户ID参数');
      return NextResponse.json(
        { error: '缺少用户ID' },
        { status: 400 }
      );
    }
    
    const studyPlans = await dbGetUserStudyPlans(userId);
    console.log(`获取到${studyPlans.length}个备考规划`);
    
    return NextResponse.json({ plans: studyPlans }, { status: 200 });
  } catch (error) {
    console.error('获取用户备考规划列表API错误:', error);
    return NextResponse.json(
      { error: '获取用户备考规划列表失败', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 