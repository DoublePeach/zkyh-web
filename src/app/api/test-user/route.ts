/**
 * @description 测试用户创建API - 仅用于测试环境
 * @author 郝桃桃
 * @date 2024-10-13
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // 仅在测试环境中启用
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      return NextResponse.json(
        { error: '此端点仅在测试环境中可用' },
        { status: 403 }
      );
    }
    
    // 解析请求参数
    const body = await request.json();
    const { id = 5, username = 'testuser' } = body || {};
    
    // 重置序列并创建测试用户
    await db.execute(sql`ALTER SEQUENCE users_id_seq RESTART WITH ${id}`);
    
    // 先尝试删除该ID的用户，如果存在的话
    await db.delete(users).where(sql`id = ${id}`);
    
    // 插入测试用户
    const [testUser] = await db.insert(users).values({
      username,
      passwordHash: '$2b$10$aBcdEfGhIjKlMnOpQrStUv1234567890abcdefghijklmnopq', // 测试密码哈希
      profession: 'nursing',
      currentTitle: 'none',
      targetTitle: 'junior',
      workYears: 1,
      studyTimePerDay: 2,
      nursingAssistantUserId: 'test-user-id',
    }).returning();
    
    console.log(`测试用户创建成功: ${JSON.stringify(testUser)}`);
    
    return NextResponse.json({ success: true, user: testUser });
  } catch (error) {
    console.error('创建测试用户失败:', error);
    return NextResponse.json(
      { 
        error: '创建测试用户失败', 
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 