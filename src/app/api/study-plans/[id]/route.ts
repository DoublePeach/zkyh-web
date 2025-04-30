/**
 * @description 备考规划详情API路由
 * @author 郝桃桃
 * @date 2023-10-02
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStudyPlanDetails as dbGetStudyPlanDetails } from '@/lib/services/study-plan-service';

type RouteParams = {
  params: {
    id: string;
  }
};

/**
 * @description 获取备考规划详情API
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
    const planId = String(params.id || '');
    console.log('处理备考规划详情请求，规划ID:', planId);
    
    if (!planId) {
      console.error('缺少规划ID参数');
      return NextResponse.json(
        { error: '缺少规划ID' },
        { status: 400 }
      );
    }
    
    const planDetails = await dbGetStudyPlanDetails(planId);
    console.log('成功获取备考规划详情');
    
    return NextResponse.json(planDetails, { status: 200 });
  } catch (error) {
    console.error('获取备考规划详情API错误:', error);
    return NextResponse.json(
      { error: '获取备考规划详情失败', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 