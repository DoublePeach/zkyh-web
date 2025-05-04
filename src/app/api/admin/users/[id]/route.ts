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
  params: Promise<{
    id: string;
  }>;
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
    // Define a more specific type for the update result if possible
    // Assuming returning() gives back the full row matching the schema
    let updatedUser: (typeof users.$inferSelect | typeof adminUsers.$inferSelect | null) = null;
    let userType: 'admin' | 'regular' | 'not_found' = 'not_found';

    // Try admin users first
    const adminCheck = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
    if (adminCheck.length > 0) {
        const result = await db
            .update(adminUsers)
            .set(dataToUpdate)
            .where(eq(adminUsers.id, id))
            .returning();
        if (result.length > 0) updatedUser = result[0];
        userType = 'admin';
    } else {
        // Try regular users
        const regularCheck = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
        if (regularCheck.length > 0) {
             const result = await db
                .update(users)
                .set(dataToUpdate)
                .where(eq(users.id, id))
                .returning();
             if (result.length > 0) updatedUser = result[0];
             userType = 'regular';
        }
    }

    if (userType === 'not_found' || !updatedUser) {
      return NextResponse.json({ success: false, error: '用户未找到或更新失败' }, { status: 404 });
    }

    // Add userType to the response data
    const responseData = { ...updatedUser, userType };
    return NextResponse.json({ success: true, data: responseData });

  } catch (error: unknown) { // Use unknown
     console.error(`更新用户失败:`, error);
     const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, error: '更新用户状态失败', message }, { status: 500 });
  }
}

// GET (User Details) and DELETE (Deactivate/Hard Delete) can be added here similarly 