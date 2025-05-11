/**
 * @description 用户学习模式API - 获取和更新用户的学习模式
 * @author 郝桃桃
 * @date 2024-05-10
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, type StudyMode } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// 判断学习模式列是否存在，避免数据库错误
async function checkStudyModeColumnExists() {
  try {
    // 尝试查询一个用户的学习模式
    await db.execute(sql`SELECT study_mode FROM users LIMIT 1`);
    return true;
  } catch (error) {
    console.error('study_mode列不存在，将返回默认值', error);
    return false;
  }
}

// 获取用户学习模式
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return new Response(JSON.stringify(
        { error: 'Missing user ID' }
      ), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return new Response(JSON.stringify(
        { error: 'Invalid user ID' }
      ), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 检查study_mode列是否存在
    const columnExists = await checkStudyModeColumnExists();
    if (!columnExists) {
      // 如果列不存在，返回默认学习模式
      return new Response(JSON.stringify({
        success: true,
        data: {
          studyMode: 'normal'
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        studyMode: true
      }
    });
    
    if (!user) {
      return new Response(JSON.stringify(
        { error: 'User not found' }
      ), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        studyMode: user.studyMode || 'normal'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching user study mode:', error);
    return new Response(JSON.stringify({
      success: true,
      data: {
        studyMode: 'normal'  // 失败时返回默认模式而不是错误
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 更新用户学习模式
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return new Response(JSON.stringify(
        { error: 'Missing user ID' }
      ), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return new Response(JSON.stringify(
        { error: 'Invalid user ID' }
      ), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 检查study_mode列是否存在
    const columnExists = await checkStudyModeColumnExists();
    if (!columnExists) {
      // 如果列不存在，提示需要运行数据库迁移
      return new Response(JSON.stringify({
        success: false,
        error: 'Database schema needs migration. Please run: npm run db:push',
        data: {
          studyMode: 'normal'
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 解析请求体
    const body = await request.json();
    const { studyMode } = body;
    
    // 验证学习模式
    const validModes: StudyMode[] = ['hard', 'hero', 'normal', 'easy'];
    if (!studyMode || !validModes.includes(studyMode as StudyMode)) {
      return new Response(JSON.stringify(
        { error: 'Invalid study mode. Must be one of: hard, hero, normal, easy' }
      ), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 检查用户是否存在
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true }
    });
    
    if (!existingUser) {
      return new Response(JSON.stringify(
        { error: 'User not found' }
      ), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 更新学习模式
    await db.update(users)
      .set({ 
        studyMode: studyMode as StudyMode,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        studyMode
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating user study mode:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update user study mode',
      data: {
        studyMode: 'normal'
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 