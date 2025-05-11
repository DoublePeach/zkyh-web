/**
 * @description 提示词文件管理API
 * @author 郝桃桃
 * @date 2024-10-12
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { withAdminAuth } from "@/lib/auth/admin-auth";

// 提示词文件保存目录
const TIPS_DIR = path.resolve(process.cwd(), 'preparation-plan-tips');

/**
 * @description 文件类型定义
 */
interface FileItem {
  id: string;           // 文件名作为ID
  name: string;         // 文件名
  type: string;         // 文件类型 (prompt, response, error)
  size: number;         // 文件大小（字节）
  created: Date;        // 创建时间
}

/**
 * @description 获取所有提示词和响应文件
 */
async function handler(_request: NextRequest) {
  try {
    // 确保目录存在
    await fs.mkdir(TIPS_DIR, { recursive: true });
    
    // 获取所有文件
    const files = await fs.readdir(TIPS_DIR);
    
    // 获取文件详细信息
    const fileDetails: FileItem[] = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(TIPS_DIR, filename);
        const stats = await fs.stat(filePath);
        
        // 确定文件类型
        let type = 'unknown';
        if (filename.includes('prompt')) {
          type = 'prompt';
        } else if (filename.includes('response')) {
          type = 'response';
        } else if (filename.includes('error')) {
          type = 'error';
        } else if (filename.includes('local_plan')) {
          type = 'local_plan';
        }
        
        return {
          id: filename,
          name: filename,
          type,
          size: stats.size,
          created: stats.birthtime
        };
      })
    );
    
    // 按创建时间降序排列
    fileDetails.sort((a, b) => b.created.getTime() - a.created.getTime());
    
    return NextResponse.json({
      success: true,
      data: fileDetails
    });
  } catch (error) {
    console.error('获取提示词文件列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取文件列表失败', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * 获取提示词文件列表
 */
export const GET = withAdminAuth(handler);

// /**
//  * 根据文件名确定文件类型
//  */
// function getFileType(filename: string): string {
//   if (filename.startsWith('prompt_')) return 'prompt';
//   if (filename.startsWith('response_')) return 'response';
//   if (filename.startsWith('error_')) return 'error';
//   if (filename.startsWith('local_plan_')) return 'local_plan';
//   return 'other';
// } 