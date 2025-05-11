/**
 * @description 异步生成备考规划API
 * @author 郝桃桃
 * @date 2024-05-09
 */

import { NextRequest, NextResponse } from 'next/server';
import { createStudyPlan as dbCreateStudyPlan } from '@/lib/services/study-plan-service';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import {
  GenerationTask,
  saveTask,
  getTask,
  updateTask,
  deleteTaskFile
} from '@/lib/services/task-generation-service';

/**
 * @description 获取生成状态
 */
export async function GET(request: NextRequest) {
  try {
    const taskId = request.nextUrl.searchParams.get('taskId');
    
    if (!taskId) {
      return new Response(JSON.stringify({ error: '缺少任务ID' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
    }
    
    const task = getTask(taskId);
    
    if (!task) {
      return new Response(JSON.stringify({ error: '任务不存在' }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        taskId: task.id,
        status: task.status,
        progress: task.progress,
        startTime: task.startTime,
        planId: task.planId,
        error: task.error
      }
    });
  } catch (error) {
    console.error('获取生成状态错误:', error);
    return new Response(JSON.stringify({ error: '获取生成状态失败' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * @description 开始生成备考规划（异步）。接收用户ID和调研表单数据，
 *              创建一个后台任务来生成规划，并立即返回任务ID给客户端。
 * @param {NextRequest} request - Next.js请求对象，包含用户ID和formData。
 * @returns {Promise<NextResponse>} - 包含任务ID或错误信息的响应。
 * @example body
 * { 
 *   "userId": 123, 
 *   "formData": { ... } 
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('接收到异步生成备考规划请求');
    
    // 确保正确处理请求体内的中文字符
    const buffer = await request.arrayBuffer();
    const text = new TextDecoder('utf-8').decode(buffer);
    const body = JSON.parse(text);
    
    const { userId, formData } = body;
    
    console.log('请求参数:', { userId });
    
    if (!userId || !formData) {
      console.error('缺少必要参数');
      return new Response(JSON.stringify({ error: '缺少必要参数' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
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
    
    // 创建任务ID
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 创建并存储任务
    const task: GenerationTask = {
      id: taskId,
      userId,
      status: 'pending',
      progress: 0,
      startTime: Date.now()
    };
    
    // 保存任务到文件
    saveTask(task);
    
    // 异步执行生成规划
    setTimeout(async () => {
      try {
        // 更新任务状态为处理中
        updateTask(taskId, { status: 'processing' });
        
        // 模拟进度更新 - 在实际环境中，这应该由实际处理过程来更新
        const progressInterval = setInterval(() => {
          const currentTask = getTask(taskId);
          if (currentTask && currentTask.status === 'processing') {
            // 计算已经过去的时间占总估计时间的百分比，最多到90%
            const elapsed = Date.now() - currentTask.startTime;
            const estimatedTotal = 3 * 60 * 1000; // 3分钟
            const progress = Math.min(Math.floor((elapsed / estimatedTotal) * 100), 90);
            
            updateTask(taskId, { progress });
          } else {
            clearInterval(progressInterval);
          }
        }, 5000);
        
        // 调用实际的生成方法
        console.log(`开始异步创建备考规划，任务ID: ${taskId}`);
        const planId = await dbCreateStudyPlan(userId, formData);
        console.log(`备考规划创建成功，ID: ${planId}`);
        
        // 更新任务状态为完成
        clearInterval(progressInterval);
        updateTask(taskId, {
          status: 'completed',
          progress: 100,
          planId
        });
        
        // 保留任务记录一段时间，然后删除（防止文件过多）
        setTimeout(async () => {
          try {
            await deleteTaskFile(taskId);
          } catch (deleteError) {
            console.error(`API路由中尝试删除任务文件(${taskId})时也遇到问题:`, deleteError);
          }
        }, 24 * 60 * 60 * 1000); // 24小时后删除
      } catch (error) {
        console.error(`创建备考规划失败，任务ID: ${taskId}`, error);
        
        // 更新任务状态为失败
        updateTask(taskId, {
          status: 'failed',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, 0);
    
    // 立即返回任务ID
    return NextResponse.json(
      { 
        success: true, 
        data: { 
          taskId,
          estimatedTimeMs: 3 * 60 * 1000 // 预计3分钟
        } 
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('创建异步备考规划请求处理错误:', error);
    return NextResponse.json(
      { 
        error: '创建异步备考规划失败', 
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 