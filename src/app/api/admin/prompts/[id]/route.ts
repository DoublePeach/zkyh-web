/**
 * @description 管理单个提示词文件的API
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
 * 获取单个提示词文件内容
 */
async function getHandler(req: NextRequest, context: { params: { id: string } }) {
  try {
    const filename = context.params.id;
    
    // 验证文件名是否合法
    if (!filename || filename.includes('..')) {
      return NextResponse.json(
        { success: false, message: '无效的文件名' },
        { status: 400 }
      );
    }
    
    const filePath = path.join(TIPS_DIR, filename);
    
    // 验证文件是否存在
    try {
      await fs.access(filePath);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: '文件不存在' },
        { status: 404 }
      );
    }
    
    // 读取文件内容
    const content = await fs.readFile(filePath, 'utf8');
    const stats = await fs.stat(filePath);
    
    return NextResponse.json({
      success: true,
      data: {
        filename,
        content,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      }
    });
  } catch (error) {
    console.error('获取提示词文件内容失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '获取文件内容失败', 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

/**
 * 删除提示词文件
 */
async function deleteHandler(req: NextRequest, context: { params: { id: string } }) {
  try {
    const filename = context.params.id;
    
    // 验证文件名是否合法
    if (!filename || filename.includes('..')) {
      return NextResponse.json(
        { success: false, message: '无效的文件名' },
        { status: 400 }
      );
    }
    
    const filePath = path.join(TIPS_DIR, filename);
    
    // 验证文件是否存在
    try {
      await fs.access(filePath);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: '文件不存在' },
        { status: 404 }
      );
    }
    
    // 删除文件
    await fs.unlink(filePath);
    
    return NextResponse.json({
      success: true,
      message: '文件删除成功'
    });
  } catch (error) {
    console.error('删除提示词文件失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '删除文件失败', 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(getHandler);
export const DELETE = withAdminAuth(deleteHandler); 