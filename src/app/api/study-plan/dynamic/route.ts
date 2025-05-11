/**
 * @description 动态备考规划API路由
 * @author 郝桃桃
 * @date 2024-08-24
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateStudyPlanFromDatabase } from '@/lib/ai';
import { DB_CONFIG } from '@/lib/config';
import * as directDb from '@/lib/direct-db';
import * as mcpDb from '@/lib/ai/postgres-mcp';
import { SurveyFormData } from '@/types/survey';

// 为了防止MCP连接失败的问题，我们实现了一个fallback机制
// 先尝试直接数据库连接，如果失败则尝试MCP连接
const isMcpEnabled = false; // 设置为false则强制使用直接数据库连接

/**
 * @description 带故障转移的获取考试学科
 */
async function fallbackFetchExamSubjects() {
  try {
    if (!isMcpEnabled) {
      return await directDb.fetchExamSubjects();
    }
    
    try {
      return await mcpDb.fetchExamSubjects();
    } catch (mcpError) {
      console.warn('MCP获取考试学科失败，回退到直接数据库连接', mcpError);
      return await directDb.fetchExamSubjects();
    }
  } catch (error) {
    console.error('获取考试学科失败:', error);
    return [];
  }
}

/**
 * @description 检查数据库连接状态
 */
export async function GET(_request: NextRequest) {
  try {
    // 获取数据库连接字符串信息（脱敏处理）
    const connectionInfo = DB_CONFIG.PG_CONNECTION_STRING.replace(/:[^@]*@/, ':***@');
    console.log('使用数据库连接:', connectionInfo);
    
    // 获取数据库表信息
    let tableNames: string[] = [];
    try {
      tableNames = await directDb.listTables();
    } catch (error) {
      console.error('获取数据库表失败:', error);
    }
    
    // 获取考试学科信息
    const subjects = await fallbackFetchExamSubjects();
    
    // 获取表统计信息
    let stats: Record<string, number> = {};
    try {
      stats = await directDb.getTableStats();
    } catch (error) {
      console.error('获取表统计信息失败:', error);
    }
    
    return NextResponse.json({
      success: true,
      connected: true,
      connectionType: isMcpEnabled ? 'MCP (回退到直接连接)' : '直接数据库连接',
      connectionInfo,
      tables: tableNames,
      examSubjectsCount: subjects.length,
      stats
    });
  } catch (error) {
    console.error('获取数据库状态失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '无法连接到数据库或获取数据库状态',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * @description 生成动态备考规划
 */
export async function POST(request: NextRequest) {
  try {
    // 从请求体中获取表单数据
    const body = await request.json();
    const formData: SurveyFormData = body.formData;
    
    // 表单数据验证
    if (!formData || !formData.titleLevel || !formData.examYear) {
      return NextResponse.json(
        { success: false, error: '缺少必要的表单数据' },
        { status: 400 }
      );
    }
    
    // 生成备考规划
    console.log('开始生成动态备考规划...');
    const plan = await generateStudyPlanFromDatabase(formData);
    console.log('备考规划生成成功');
    
    // 返回生成的规划
    return NextResponse.json({
      success: true,
      plan
    });
  } catch (error) {
    console.error('生成备考规划失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '生成备考规划失败',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 