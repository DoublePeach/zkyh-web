/**
 * @description 管理后台身份验证中间件
 * @author 郝桃桃
 * @date 2024-06-17
 */
import { NextResponse, NextRequest } from 'next/server'

// 需要保护的管理后台路径
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

// API路径，处理方式同样
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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 管理员登录路径不需要验证
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next()
  }
  
  // 优化检测逻辑：使用更精确的路径匹配
  const isAdminPath = PROTECTED_ADMIN_PATHS.some(path => 
    pathname === path || pathname.startsWith(`${path}/`))
  
  const isAdminApiPath = PROTECTED_ADMIN_API_PATHS.some(path => 
    pathname === path || pathname.startsWith(`${path}/`))

  // 如果是管理后台路径或API路径，检查是否有有效会话
  if (isAdminPath || isAdminApiPath) {
    const adminSession = request.cookies.get('admin_session')

    // 如果无有效会话，重定向到管理员登录页面或返回401
    if (!adminSession || !adminSession.value) {
      console.log(`[AUTH] 无效管理员会话，访问: ${pathname}`)
      
      // API请求返回401状态码
      if (isAdminApiPath) {
        return NextResponse.json(
          { success: false, message: '未授权，请重新登录' },
          { status: 401 }
        )
      }
      
      // 页面请求重定向到登录
      const loginUrl = new URL('/admin/login', request.url)
      // 记录原始URL以便登录后重定向回去
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

// 配置中间件匹配路径
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
} 