/**
 * @description 管理员登录API
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
// 实际项目中应该使用如bcrypt等加密库
// import { compare } from "bcrypt";

// 登录请求验证schema
const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    // 解析请求体
    const body = await req.json();
    const validatedData = loginSchema.parse(body);

    // 查询管理员用户
    const user = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.username, validatedData.username),
    });

    // 检查用户是否存在
    if (!user) {
      return NextResponse.json(
        { success: false, message: "用户名或密码错误" },
        { status: 401 }
      );
    }

    // 检查用户是否激活
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: "账户已被禁用，请联系管理员" },
        { status: 403 }
      );
    }

    // 密码验证 (实际项目中应该使用加密比较)
    // const passwordMatch = await compare(validatedData.password, user.password);
    const passwordMatch = validatedData.password === user.password;

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: "用户名或密码错误" },
        { status: 401 }
      );
    }

    // 更新最后登录时间
    await db
      .update(adminUsers)
      .set({
        lastLogin: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, user.id));

    // 设置登录会话cookie
    cookies().set("admin_session", String(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      // 2小时过期
      maxAge: 60 * 60 * 2,
    });

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: "登录成功",
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("管理员登录错误:", error);
    return NextResponse.json(
      { success: false, message: "登录失败，请重试" },
      { status: 500 }
    );
  }
}