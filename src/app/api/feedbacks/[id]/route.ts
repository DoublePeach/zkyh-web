/**
 * @description 单个反馈API路由 - 获取和更新反馈
 * @author 郝桃桃
 * @date 2024-05-10
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFeedbackById, updateFeedbackStatus } from '@/lib/services/feedback-service';

/**
 * 获取单个反馈详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: '缺少反馈ID' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const feedbackId = parseInt(id);
    
    if (isNaN(feedbackId)) {
      return new Response(JSON.stringify({ success: false, error: '无效的反馈ID' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 获取反馈详情
    const feedback = await getFeedbackById(feedbackId);
    
    if (!feedback) {
      return new Response(JSON.stringify({ success: false, error: '反馈不存在' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      data: feedback
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('获取反馈详情失败:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || '获取反馈详情失败' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 更新反馈状态和备注
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: '缺少反馈ID' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const feedbackId = parseInt(id);
    
    if (isNaN(feedbackId)) {
      return new Response(JSON.stringify({ success: false, error: '无效的反馈ID' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 解析请求体
    const { status, adminNotes } = await request.json();
    
    if (!status) {
      return new Response(JSON.stringify({ success: false, error: '缺少状态参数' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 更新反馈状态
    const success = await updateFeedbackStatus(feedbackId, status, adminNotes);
    
    return new Response(JSON.stringify({
      success: true,
      data: { updated: success }
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('更新反馈状态失败:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || '更新反馈状态失败' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 