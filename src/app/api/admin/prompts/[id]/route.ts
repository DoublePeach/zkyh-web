/**
 * @description 提示词文件操作API
 * @author 郝桃桃
 * @date 2024-10-01
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { withAdminAuth } from '@/lib/auth/admin-auth';

// 提示词文件保存目录
const TIPS_DIR = path.resolve(process.cwd(), 'preparation-plan-tips');

// 获取提示词文件
export const GET = withAdminAuth(async (
  req: NextRequest, 
  context: any
) => {
  // 获取提示词
  const { id } = context.params;
  
  try {
    // 查找提示词文件
    const promptsDir = path.join(process.cwd(), 'preparation-plan-tips');
    
    // 检查目录是否存在
    if (!fs.existsSync(promptsDir)) {
      return NextResponse.json(
        { success: false, message: '提示词目录不存在' },
        { status: 404 }
      );
    }
    
    // 获取文件列表
    const files = fs.readdirSync(promptsDir);
    
    // 查找匹配的文件
    const targetFile = files.find((file: string) => file.includes(id));
    
    if (!targetFile) {
      return NextResponse.json(
        { success: false, message: '提示词文件不存在' },
        { status: 404 }
      );
    }
    
    // 获取文件信息
    const filePath = path.join(promptsDir, targetFile);
    const stats = fs.statSync(filePath);
    
    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf-8');
    
    return NextResponse.json({
      success: true,
      data: {
        filename: targetFile,
        content,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      }
    });
  } catch (error) {
    console.error('获取提示词失败:', error);
    return NextResponse.json(
      { success: false, message: '获取提示词失败' },
      { status: 500 }
    );
  }
});

// 删除提示词文件
export const DELETE = withAdminAuth(async (
  req: NextRequest, 
  context: any
) => {
  // 删除提示词
  const { id } = context.params;
  
  try {
    // 查找提示词文件
    const promptsDir = path.join(process.cwd(), 'preparation-plan-tips');
    
    // 检查目录是否存在
    if (!fs.existsSync(promptsDir)) {
      return NextResponse.json(
        { success: false, message: '提示词目录不存在' },
        { status: 404 }
      );
    }
    
    // 获取文件列表
    const files = fs.readdirSync(promptsDir);
    
    // 查找匹配的文件
    const targetFile = files.find((file: string) => file.includes(id));
    
    if (!targetFile) {
      return NextResponse.json(
        { success: false, message: '提示词文件不存在' },
        { status: 404 }
      );
    }
    
    // 删除文件
    const filePath = path.join(promptsDir, targetFile);
    fs.unlinkSync(filePath);
    
    return NextResponse.json({
      success: true,
      message: '删除提示词成功'
    });
  } catch (error) {
    console.error('删除提示词失败:', error);
    return NextResponse.json(
      { success: false, message: '删除提示词失败' },
      { status: 500 }
    );
  }
}); 