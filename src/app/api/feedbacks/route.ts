/**
 * @description 用户反馈API - 提交和获取用户反馈
 * @author 郝桃桃
 * @date 2024-05-10
 */

import { NextRequest, NextResponse } from 'next/server';
import { submitFeedback, getFeedbacks } from '@/lib/services/feedback-service';
import { logUserAction } from '@/lib/services/log-service';

/**
 * 提交用户反馈
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, satisfaction, suggestion, contactPhone, willContact, source } = await request.json();
    
    // 验证必填参数
    if (!userId || !satisfaction) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    // 验证满意度范围
    if (satisfaction < 1 || satisfaction > 10) {
      return NextResponse.json(
        { success: false, error: '满意度评分必须介于1-10分之间' },
        { status: 400 }
      );
    }
    
    // 提交反馈
    const feedbackId = await submitFeedback({
      userId,
      satisfaction,
      suggestion,
      contactPhone,
      willContact: Boolean(willContact),
      source
    });
    
    // 记录用户操作
    await logUserAction({
      userId,
      action: 'submit_feedback',
      page: request.nextUrl.pathname,
      details: { 
        feedbackId,
        satisfaction,
        willContact: Boolean(willContact)
      }
    }).catch(e => console.error('记录用户反馈操作失败', e));
    
    return NextResponse.json({
      success: true,
      data: { feedbackId }
    });
  } catch (error: any) {
    console.error('提交反馈失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '提交反馈失败' },
      { status: 500 }
    );
  }
}

/**
 * 获取反馈列表（管理员用）
 */
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status') || undefined;
    
    // 获取反馈列表
    const result = await getFeedbacks(page, pageSize, status);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('获取反馈列表失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '获取反馈列表失败' },
      { status: 500 }
    );
  }
} 