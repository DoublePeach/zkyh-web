/**
 * @description 备考规划详情API路由
 * @author 郝桃桃
 * @date 2023-10-02
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStudyPlanDetails, deleteStudyPlan } from '@/lib/services/study-plan-service';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * @description 获取备考规划详情API
 */
export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    // 在Next.js 15中，params需要先await
    const params = await context.params;
    
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
    
    const result = await getStudyPlanDetails(planId);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      );
    }
    
    console.log('成功获取备考规划详情');
    
    // 返回完整的规划数据
    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('获取备考规划详情API错误:', error);
    return NextResponse.json(
      { success: false, error: '获取备考规划详情失败', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * @description 删除备考规划API
 */
export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  try {
    // 在Next.js 15中，params需要先await
    const params = await context.params;
    
    // 安全地访问ID
    const planId = String(params.id || '');
    console.log('处理删除备考规划请求，规划ID:', planId);
    
    if (!planId) {
      console.error('缺少规划ID参数');
      return NextResponse.json(
        { success: false, error: '缺少规划ID' },
        { status: 400 }
      );
    }
    
    const result = await deleteStudyPlan(planId);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      );
    }
    
    console.log('成功删除备考规划');
    
    return NextResponse.json({
      success: true,
      message: '备考规划已删除'
    });
  } catch (error) {
    console.error('删除备考规划API错误:', error);
    return NextResponse.json(
      { success: false, error: '删除备考规划失败', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 