/**
 * @description API route for managing exam papers (List and Create)
 * @author 郝桃桃
 * @date 2024-05-27
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { examPapers, examSubjects } from '@/db/schema/index';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';

// Validation schema for creating an exam paper
const createExamPaperSchema = z.object({
  title: z.string().min(1, '试卷标题不能为空'),
  description: z.string().optional(),
  subjectId: z.number().int().positive('必须关联一个考试科目'),
  duration: z.number().int().positive('考试时长必须为正整数').optional(),
  totalScore: z.number().int().positive('总分必须为正整数').optional(),
  passingScore: z.number().int().positive('及格分数必须为正整数').optional(),
  questionIds: z.array(z.number().int().positive()).optional().default([]), // 试题ID列表
  status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),
});

/**
 * @description 获取试卷列表
 * @param {NextRequest} request // request parameter is unused
 * @returns {NextResponse}
 */
export async function GET(/* request: NextRequest */) { // Comment out unused parameter
  try {
    const papers = await db.select({
        id: examPapers.id,
        title: examPapers.title,
        description: examPapers.description,
        status: examPapers.status,
        subjectName: examSubjects.name, // Include subject name
        createdAt: examPapers.createdAt,
        updatedAt: examPapers.updatedAt,
      })
      .from(examPapers)
      .leftJoin(examSubjects, eq(examPapers.subjectId, examSubjects.id))
      .orderBy(desc(examPapers.createdAt));
      
    return NextResponse.json({ success: true, data: papers });
  } catch (error) {
    console.error("获取试卷列表失败:", error);
    return NextResponse.json(
      { success: false, error: '获取试卷列表失败' },
      { status: 500 }
    );
  }
}

/**
 * @description 创建新试卷
 * @param {NextRequest} request
 * @returns {NextResponse}
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createExamPaperSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: '验证失败', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { title, description, subjectId, duration, totalScore, passingScore, questionIds, status } = validation.data;

    const newPaper = await db
      .insert(examPapers)
      .values({
        title,
        description,
        subjectId,
        duration,
        totalScore,
        passingScore,
        questionIds,
        status,
        updatedAt: new Date(), // Manually set updatedAt on creation as well
      })
      .returning();

    return NextResponse.json({ success: true, data: newPaper[0] }, { status: 201 });
  } catch (error) {
    console.error("创建试卷失败:", error);
    // Add specific error handling for potential foreign key constraint errors etc.
    return NextResponse.json(
      { success: false, error: '创建试卷失败' },
      { status: 500 }
    );
  }
} 