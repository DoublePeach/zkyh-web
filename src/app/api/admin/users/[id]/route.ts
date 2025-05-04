/**
 * @description API route for managing a single user (currently focuses on status update)
 * @author 郝桃桃
 * @date 2024-05-27
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, adminUsers } from '@/db/schema/index';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

type RouteContext = {
  params: {
    id: string;
  };
};

// Validation schema for updating user status
const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
  // Add other updatable fields here if needed in the future
});

/**
 * @description 更新用户信息（目前主要是状态）
 * @param {NextRequest} request
 * @param {RouteContext} context
 * @returns {NextResponse}
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params; // Await params
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: '无效的用户ID' }, { status: 400 });
    }

    const body = await request.json();
    const validation = updateUserStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: '验证失败', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { isActive } = validation.data;
    const dataToUpdate = { isActive: isActive, updatedAt: new Date() };

    // Determine user type and update
    let updatedUser: any[] = [];
    let userType: 'admin' | 'regular' | 'not_found' = 'not_found';

    // Try admin users first
    const adminCheck = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
    if (adminCheck.length > 0) {
        // Prevent deactivating the last active admin or self? (Add logic if needed)
        // For simplicity, allow deactivation for now.
        updatedUser = await db
            .update(adminUsers)
            .set(dataToUpdate)
            .where(eq(adminUsers.id, id))
            .returning();
        userType = 'admin';
    } else {
        // Try regular users
        const regularCheck = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
        if (regularCheck.length > 0) {
             updatedUser = await db
                .update(users)
                .set(dataToUpdate)
                .where(eq(users.id, id))
                .returning();
             userType = 'regular';
        }
    }

    if (userType === 'not_found') {
      return NextResponse.json({ success: false, error: '用户未找到' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { ...updatedUser[0], userType } });

  } catch (error) {
     console.error(`更新用户 ${context.params.id} 失败:`, error);
    return NextResponse.json({ success: false, error: '更新用户状态失败' }, { status: 500 });
  }
}

// GET (User Details) and DELETE (Deactivate/Hard Delete) can be added here similarly 