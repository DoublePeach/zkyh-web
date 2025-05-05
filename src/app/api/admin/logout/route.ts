/**
 * @description 管理员退出登录API
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { NextResponse } from "next/server";

export function GET() {
  // 创建重定向响应
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  console.log(`[LOGOUT] 管理员退出登录, 重定向到: ${baseUrl}/admin/login, 环境: ${process.env.NODE_ENV}`);
  
  const response = NextResponse.redirect(
    new URL("/admin/login", baseUrl)
  );
  
  // 通过设置过期cookie来清除会话，确保所有环境参数一致
  response.cookies.set({
    name: "admin_session",
    value: "",
    expires: new Date(0),
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN || undefined : undefined,
  });
  
  return response;
} 