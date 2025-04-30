import { NextResponse } from 'next/server';
import { db } from '@/db';
import { todos } from '@/db/schema';
import { eq } from 'drizzle-orm';

// 获取所有待办事项
export async function GET() {
  try {
    const allTodos = await db.select().from(todos);
    return NextResponse.json(allTodos);
  } catch (error) {
    console.error('Failed to fetch todos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    );
  }
}

// 创建新待办事项
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, userId } = body;

    if (!title || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newTodo = await db.insert(todos).values({
      title,
      userId,
    }).returning();

    return NextResponse.json(newTodo[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create todo:', error);
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    );
  }
} 