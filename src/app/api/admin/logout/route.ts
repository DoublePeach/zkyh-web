/**
 * @description 管理员退出登录API
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { NextResponse } from "next/server";

export function GET() {
  // 创建重定向响应
  const response = NextResponse.redirect(
    new URL("/admin/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
  );
  
  // 通过设置过期cookie来清除会话
  response.cookies.set({
    name: "admin_session",
    value: "",
    expires: new Date(0),
    path: "/",
  });
  
  return response;
} 