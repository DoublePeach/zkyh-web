/**
 * @description 普通用户退出登录API。清除用户会话并重定向到首页。
 * @author 郝桃桃
 * @date 2024-07-15
 */
import { NextResponse } from "next/server";

/**
 * @description 处理普通用户的登出请求。
 *              通过清除 'session_token' cookie 来结束用户会话，并重定向用户到应用首页。
 * @returns {NextResponse} 一个重定向到首页的响应，并在headers中设置了清除cookie的指令。
 */
export function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  console.log(`[LOGOUT] 用户退出登录, 重定向到: ${baseUrl}/, 环境: ${process.env.NODE_ENV}`);
  
  const response = NextResponse.redirect(
    new URL("/", baseUrl)
  );
  
  // 通过设置过期cookie来清除会话，确保所有环境参数一致
  response.cookies.set({
    name: "session_token", // 针对普通用户会话token
    value: "",
    expires: new Date(0),
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // domain 属性通常在需要跨子域共享cookie或特定主域时设置
    // 如果应用和API在同一主域的不同子域，或者希望明确指定，则使用
    domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN || undefined : undefined,
  });
  
  return response;
} 