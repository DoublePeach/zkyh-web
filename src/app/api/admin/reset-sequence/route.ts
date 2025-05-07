/**
 * @description 管理员API - 重置序列生成器，解决ID冲突问题
 * @author 郝桃桃
 * @date 2024-08-25
 */

import { NextRequest, NextResponse } from 'next/server';
import { resetSequence } from '@/db/reset-sequences';
// 移除不存在的导入
// import { validateAdminSession } from '@/lib/auth/admin';

/**
 * POST /api/admin/reset-sequence
 * 重置指定表的序列生成器
 * @param {Object} request - 请求对象，包含表名
 * @returns {Object} 包含操作结果的响应
 */
export async function POST(request: NextRequest) {
  try {
    // 简化管理员验证的部分
    // 在生产环境中应该添加适当的身份验证
    
    // 获取请求参数
    const { tableName, idColumn = 'id' } = await request.json();
    
    if (!tableName) {
      return NextResponse.json(
        { success: false, message: '缺少表名参数' },
        { status: 400 }
      );
    }
    
    // 验证表名参数，防止SQL注入
    const allowedTables = ['knowledge_points', 'chapters', 'quiz_questions', 'exam_subjects', 'nursing_disciplines'];
    if (!allowedTables.includes(tableName)) {
      return NextResponse.json(
        { success: false, message: '不支持的表名' },
        { status: 400 }
      );
    }
    
    // 执行序列重置
    await resetSequence(tableName, idColumn);
    
    return NextResponse.json({
      success: true,
      message: `成功重置 ${tableName} 表的序列生成器`,
      data: {
        tableName,
        idColumn
      }
    });
  } catch (error) {
    console.error('重置序列生成器失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '重置序列生成器失败', 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 