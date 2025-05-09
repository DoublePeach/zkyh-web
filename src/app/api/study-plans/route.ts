/**
 * @description 备考规划API路由
 * @author 郝桃桃
 * @date 2023-10-02
 */

import { NextRequest, NextResponse } from 'next/server';
import { createStudyPlan as dbCreateStudyPlan } from '@/lib/services/study-plan-service';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

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
    
    // 验证用户是否存在
    const userExists = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.id, typeof userId === 'string' ? parseInt(userId) : userId))
      .limit(1);
      
    if (!userExists.length) {
      console.error(`用户ID ${userId} 不存在`);
      return NextResponse.json(
        { error: '用户不存在', userId },
        { status: 404 }
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