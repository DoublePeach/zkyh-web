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
    
    // 确保正确处理请求体内的中文字符
    const buffer = await request.arrayBuffer();
    const text = new TextDecoder('utf-8').decode(buffer);
    const body = JSON.parse(text);
    
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
    
    // 设置响应头，确保使用UTF-8编码
    return new NextResponse(
      JSON.stringify({ planId }), 
      { 
        status: 201,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    );
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