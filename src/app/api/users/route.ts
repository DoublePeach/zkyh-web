import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';

// 获取所有用户
export async function GET() {
  try {
    const allUsers = await db.select().from(users);
    return NextResponse.json(allUsers);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// 创建新用户
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, profession, currentTitle, targetTitle } = body;

    if (!username || !password || !profession || !currentTitle || !targetTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
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

    return NextResponse.json(newUser[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
} 