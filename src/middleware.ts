/**
 * @description 管理后台身份验证中间件（当前已禁用验证）
 * @author 郝桃桃
 * @date 2024-06-17
 */
import { NextResponse, NextRequest } from 'next/server'

// 所有管理路径不再需要鉴权，注释保留作为参考
/* 
// 需要保护的管理后台路径 (当前已禁用)
const PROTECTED_ADMIN_PATHS = [
  '/admin',
  '/admin/dashboard',
  '/admin/exam-subjects',
  '/admin/nursing-disciplines',
  '/admin/chapters',
  '/admin/knowledge-points',
  '/admin/test-banks',
  '/admin/quiz-questions',
  '/admin/users',
  '/admin/study-plans',
  '/admin/exam-papers'
]

// API路径，处理方式同样 (当前已禁用)
const PROTECTED_ADMIN_API_PATHS = [
  '/api/admin/chapters',
  '/api/admin/exam-subjects',
  '/api/admin/nursing-disciplines',
  '/api/admin/knowledge-points',
  '/api/admin/test-banks',
  '/api/admin/quiz-questions',
  '/api/admin/users',
  '/api/admin/study-plans',
  '/api/admin/exam-papers'
]
*/

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 记录访问日志，但不做身份验证
  if (pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/')) {
    console.log(`[AUTH] 已禁用鉴权: 允许访问管理路径 ${pathname}, 环境: ${process.env.NODE_ENV}`);
  }

  // 所有请求都直接放行
  return NextResponse.next()
}

// 配置中间件匹配路径 - 仅用于日志记录
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
} 