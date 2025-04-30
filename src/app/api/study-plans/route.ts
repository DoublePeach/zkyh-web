/**
 * @description 备考规划API路由
 * @author 郝桃桃
 * @date 2023-10-02
 */

import { NextRequest, NextResponse } from 'next/server';
import { createStudyPlan as dbCreateStudyPlan } from '@/lib/services/study-plan-service';

/**
 * @description 创建备考规划API
 */
export async function POST(request: NextRequest) {
  try {
    console.log('接收到创建备考规划请求');
    
    const body = await request.json();
    const { userId, formData } = body;
    
    console.log('请求参数:', { userId });
    console.log('表单数据:', {
      profession: formData?.profession,
      targetTitle: formData?.targetTitle,
      examDate: formData?.examDate,
    });
    
    if (!userId || !formData) {
      console.error('缺少必要参数');
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    console.log('开始创建备考规划...');
    const planId = await dbCreateStudyPlan(userId, formData);
    console.log(`备考规划创建成功，ID: ${planId}`);
    
    return NextResponse.json({ planId }, { status: 201 });
  } catch (error) {
    console.error('创建备考规划API错误:', error);
    return NextResponse.json(
      { 
        error: '创建备考规划失败', 
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 