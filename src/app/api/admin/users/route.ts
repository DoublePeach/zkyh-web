/**
 * @description API route for listing users (both regular and admin)
 * @author 郝桃桃
 * @date 2024-05-27
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, adminUsers } from '@/db/schema/index';
import { desc } from 'drizzle-orm';

/**
 * @description 获取所有用户（普通用户和管理员）列表
 * @param {NextRequest} request
 * @returns {NextResponse}
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch regular users
    const regularUsers = await db.select({
        id: users.id,
        username: users.username,
        profession: users.profession,
        currentTitle: users.currentTitle,
        targetTitle: users.targetTitle,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        userType: 'regular' // Add type identifier
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    // Fetch admin users
    const adminUserList = await db.select({
        id: adminUsers.id,
        username: adminUsers.username,
        name: adminUsers.name,
        role: adminUsers.role,
        isActive: adminUsers.isActive,
        lastLogin: adminUsers.lastLogin,
        createdAt: adminUsers.createdAt,
        updatedAt: adminUsers.updatedAt,
        userType: 'admin' // Add type identifier
      })
      .from(adminUsers)
      .orderBy(desc(adminUsers.createdAt));

    // Combine lists (consider pagination in a real application)
    const combinedUsers = [...adminUserList, ...regularUsers];

    return NextResponse.json({ success: true, data: combinedUsers });
  } catch (error) {
    console.error("获取用户列表失败:", error);
    return NextResponse.json(
      { success: false, error: '获取用户列表失败' },
      { status: 500 }
    );
  }
} 