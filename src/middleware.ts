/**
 * @description 管理后台身份验证中间件
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { NextResponse, NextRequest } from 'next/server'

// 需要保护的管理后台路径
const PROTECTED_ADMIN_PATHS = [
  '/admin/dashboard',
  '/admin/exam-subjects',
  '/admin/nursing-disciplines',
  '/admin/chapters',
  '/admin/knowledge-points',
  '/admin/test-banks',
  '/admin/quiz-questions',
  '/admin/users',
  '/admin/study-plans',
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 检查是否访问管理后台受保护路径
  const isAdminPath = PROTECTED_ADMIN_PATHS.some(path => 
    pathname.startsWith(path)
  ) || pathname === '/admin'

  // 如果是管理后台路径，检查是否有有效会话
  if (isAdminPath) {
    const adminSession = request.cookies.get('admin_session')

    // 如果无有效会话，重定向到登录页面
    if (!adminSession || !adminSession.value) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

// 配置中间件匹配路径
export const config = {
  matcher: [
    '/admin/:path*',
  ],
} 