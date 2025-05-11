import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';

// 获取所有用户
export async function GET() {
  try {
    const allUsers = await db.select().from(users);
    return new Response(JSON.stringify(allUsers), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch users' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 创建新用户
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, profession, currentTitle, targetTitle } = body;

    if (!username || !password || !profession || !currentTitle || !targetTitle) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
    }

    // 创建用户时所需的最小字段
    const newUser = await db.insert(users).values({
      username,
      passwordHash: password, // 注意：实际应用中应该对密码进行哈希处理
      profession,
      currentTitle,
      targetTitle,
      // 可选字段将使用默认值
    }).returning();

    return new Response(JSON.stringify(newUser[0]), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to create user:', error);
    return new Response(JSON.stringify({ error: 'Failed to create user' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 