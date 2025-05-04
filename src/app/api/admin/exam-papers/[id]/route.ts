/**
 * @description API route for managing a single exam paper (Read, Update, Delete)
 * @author 郝桃桃
 * @date 2024-06-17
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { examPapers, examSubjects } from '@/db/schema/index';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth/admin-auth';
import { getRouteParams, parseIdParam } from '@/lib/utils/route-utils';

// Validation schema for updating an exam paper (similar to create, but all optional)
const updateExamPaperSchema = z.object({
  title: z.string().min(1, '试卷标题不能为空').optional(),
  description: z.string().optional().nullable(), // Allow clearing description
  subjectId: z.number().int().positive('必须关联一个考试科目').optional(),
  duration: z.number().int().positive('考试时长必须为正整数').optional().nullable(),
  totalScore: z.number().int().positive('总分必须为正整数').optional().nullable(),
  passingScore: z.number().int().positive('及格分数必须为正整数').optional().nullable(),
  questionIds: z.array(z.number().int().positive()).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

/**
 * @description 获取单个试卷详情
 * @param {NextRequest} request
 * @param {Object} context
 * @returns {NextResponse}
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // 验证管理员身份
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: '未授权，请重新登录' },
        { status: 401 }
      );
    }
    
    const params = await getRouteParams(context);
    const { id, isValid } = parseIdParam(params.id);

    if (!isValid) {
      return NextResponse.json({ success: false, error: '无效的试卷ID' }, { status: 400 });
    }

    // Query with join to get subject name
    const paper = await db.select({
        id: examPapers.id,
        title: examPapers.title,
        description: examPapers.description,
        subjectId: examPapers.subjectId,
        duration: examPapers.duration,
        totalScore: examPapers.totalScore,
        passingScore: examPapers.passingScore,
        questionIds: examPapers.questionIds,
        status: examPapers.status,
        createdAt: examPapers.createdAt,
        updatedAt: examPapers.updatedAt,
        subjectName: examSubjects.name,
      })
      .from(examPapers)
      .where(eq(examPapers.id, id))
      .leftJoin(examSubjects, eq(examPapers.subjectId, examSubjects.id))
      .limit(1);

    if (paper.length === 0) {
      return NextResponse.json({ success: false, error: '试卷未找到' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: paper[0] });
  } catch (error) {
    console.error(`获取试卷失败:`, error);
    return NextResponse.json({ success: false, error: '获取试卷详情失败' }, { status: 500 });
  }
}

/**
 * @description 更新试卷信息
 * @param {NextRequest} request
 * @param {Object} context
 * @returns {NextResponse}
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // 验证管理员身份
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: '未授权，请重新登录' },
        { status: 401 }
      );
    }
    
    const params = await getRouteParams(context);
    const { id, isValid } = parseIdParam(params.id);

    if (!isValid) {
      return NextResponse.json({ success: false, error: '无效的试卷ID' }, { status: 400 });
    }

    const body = await request.json();
    const validation = updateExamPaperSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: '验证失败', details: validation.error.format() },
        { status: 400 }
      );
    }

    const dataToUpdate = { ...validation.data, updatedAt: new Date() };

    // Check if paper exists before updating
    const existingPaper = await db.select({ id: examPapers.id }).from(examPapers).where(eq(examPapers.id, id)).limit(1);
    if (existingPaper.length === 0) {
         return NextResponse.json({ success: false, error: '试卷未找到' }, { status: 404 });
    }

    const updatedPaper = await db
      .update(examPapers)
      .set(dataToUpdate)
      .where(eq(examPapers.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedPaper[0] });
  } catch (error) {
     console.error(`更新试卷失败:`, error);
     // Add specific error handling
    return NextResponse.json({ success: false, error: '更新试卷失败' }, { status: 500 });
  }
}

/**
 * @description 删除试卷
 * @param {NextRequest} request
 * @param {Object} context
 * @returns {NextResponse}
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // 验证管理员身份
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: '未授权，请重新登录' },
        { status: 401 }
      );
    }
    
    const params = await getRouteParams(context);
    const { id, isValid } = parseIdParam(params.id);

    if (!isValid) {
      return NextResponse.json({ success: false, error: '无效的试卷ID' }, { status: 400 });
    }

     // Check if paper exists before deleting
     const existingPaper = await db.select({ id: examPapers.id }).from(examPapers).where(eq(examPapers.id, id)).limit(1);
     if (existingPaper.length === 0) {
          return NextResponse.json({ success: false, error: '试卷未找到' }, { status: 404 });
     }

    await db.delete(examPapers).where(eq(examPapers.id, id));

    return NextResponse.json({ success: true, message: '试卷删除成功' }, { status: 200 }); // 200 or 204
  } catch (error) {
    console.error(`删除试卷失败:`, error);
     // Add specific error handling (e.g., related records preventing deletion)
    return NextResponse.json({ success: false, error: '删除试卷失败' }, { status: 500 });
  }
} 