/**
 * @description 验证用户会话API
 * @author 郝桃桃
 * @date 2024-08-29
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // 从cookie中获取JWT令牌
    const userTokenCookie = request.cookies.get('session_token');
    
    if (!userTokenCookie?.value) {
      return NextResponse.json(
        { success: false, message: '用户未授权' },
        { status: 401 }
      );
    }
    
    // 验证JWT令牌
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_SECRET环境变量未设置');
      return NextResponse.json(
        { success: false, message: '服务器配置错误' },
        { status: 500 }
      );
    }
    
    try {
      // 验证令牌
      const decoded = jwt.verify(userTokenCookie.value, JWT_SECRET) as { userId: string; username: string };
      
      // 令牌有效，返回成功响应
      return NextResponse.json({
        success: true,
        message: '会话有效',
        user: {
          id: decoded.userId,
          username: decoded.username
        }
      });
    } catch (error) {
      // 令牌无效或已过期
      console.error('JWT验证失败:', error);
      return NextResponse.json(
        { success: false, message: '用户会话已过期' },
        { status: 401 }
      );
    }
    
  } catch (error) {
    console.error('验证会话时出错:', error);
    return NextResponse.json(
      { success: false, message: '验证会话时发生服务器错误' },
      { status: 500 }
    );
  }
} 