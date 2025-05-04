/**
 * @description 单个知识点管理API
 * @author 郝桃桃
 * @date 2024-06-17
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { knowledgePoints, chapters, nursingDisciplines, examSubjects, quizQuestions } from "@/db/schema";
import { eq, and, ne, count } from "drizzle-orm";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/admin-auth";
import { getRouteParams, parseIdParam } from "@/lib/utils/route-utils";

// 请求验证Schema
const knowledgePointSchema = z.object({
  chapterId: z.number().int().positive("章节ID必须是正整数"),
  subjectId: z.number().int().positive("考试科目ID必须是正整数"),
  title: z.string().min(1, "知识点标题不能为空"),
  content: z.string().min(1, "知识点内容不能为空"),
  difficulty: z.number().int().min(1).max(5, "难度级别必须在1-5之间"),
  importance: z.number().int().min(1).max(5, "重要程度必须在1-5之间"),
  keywords: z.array(z.string()).optional(),
  tags: z.record(z.string(), z.any()).optional(),
});

/**
 * 错误处理函数
 * @param error 错误对象
 * @param operation 操作描述
 * @returns NextResponse错误响应
 */
function handleError(error: unknown, operation: string): NextResponse {
  console.error(`${operation}失败:`, error);
  
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { success: false, message: "数据验证失败", errors: error.errors },
      { status: 400 }
    );
  }
  
  // 检查是否是外键约束错误
  const errorString = String(error);
  if (errorString.includes("violates foreign key constraint") && 
      errorString.includes("quiz_questions_knowledge_point_id_knowledge_points_id_fk")) {
    return NextResponse.json(
      { 
        success: false, 
        message: "该知识点关联了试题，请先删除关联的试题", 
        error: "外键约束错误"
      },
      { status: 400 }
    );
  }
  
  return NextResponse.json(
    { success: false, message: `${operation}失败`, error: String(error) },
    { status: 500 }
  );
}

// 获取单个知识点
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员身份
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: '未授权，请重新登录' },
        { status: 401 }
      );
    }

    // 获取路由参数
    const params = await getRouteParams(context);
    const { id, isValid } = parseIdParam(params.id);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "无效的ID" },
        { status: 400 }
      );
    }

    // 获取知识点详细信息，包含关联数据
    const result = await db.select({
      id: knowledgePoints.id,
      chapterId: knowledgePoints.chapterId,
      chapterName: chapters.name,
      disciplineId: chapters.disciplineId,
      disciplineName: nursingDisciplines.name,
      subjectId: knowledgePoints.subjectId,
      subjectName: examSubjects.name,
      title: knowledgePoints.title,
      content: knowledgePoints.content,
      difficulty: knowledgePoints.difficulty,
      importance: knowledgePoints.importance,
      keywords: knowledgePoints.keywords,
      tags: knowledgePoints.tags,
      createdAt: knowledgePoints.createdAt,
      updatedAt: knowledgePoints.updatedAt,
    })
    .from(knowledgePoints)
    .leftJoin(chapters, eq(knowledgePoints.chapterId, chapters.id))
    .leftJoin(nursingDisciplines, eq(chapters.disciplineId, nursingDisciplines.id))
    .leftJoin(examSubjects, eq(knowledgePoints.subjectId, examSubjects.id))
    .where(eq(knowledgePoints.id, id))
    .execute();

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: "知识点不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    return handleError(error, "获取知识点");
  }
}

// 更新知识点
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员身份
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: '未授权，请重新登录' },
        { status: 401 }
      );
    }

    // 获取路由参数
    const params = await getRouteParams(context);
    const { id, isValid } = parseIdParam(params.id);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "无效的ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = knowledgePointSchema.parse(body);

    // 检查知识点是否存在
    const existingPoint = await db.query.knowledgePoints.findFirst({
      where: eq(knowledgePoints.id, id),
    });

    if (!existingPoint) {
      return NextResponse.json(
        { success: false, message: "知识点不存在" },
        { status: 404 }
      );
    }

    // 检查章节是否存在
    const chapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, validatedData.chapterId),
    });

    if (!chapter) {
      return NextResponse.json(
        { success: false, message: "所选章节不存在" },
        { status: 400 }
      );
    }

    // 检查考试科目是否存在
    const subject = await db.query.examSubjects.findFirst({
      where: eq(examSubjects.id, validatedData.subjectId),
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, message: "所选考试科目不存在" },
        { status: 400 }
      );
    }

    // 如果更改了章节或标题，检查新章节下是否已存在同名知识点
    if (
      validatedData.chapterId !== existingPoint.chapterId ||
      validatedData.title !== existingPoint.title
    ) {
      const titleExists = await db.query.knowledgePoints.findFirst({
        where: and(
          eq(knowledgePoints.chapterId, validatedData.chapterId),
          eq(knowledgePoints.title, validatedData.title),
          ne(knowledgePoints.id, id)
        ),
      });

      if (titleExists) {
        return NextResponse.json(
          { success: false, message: "该章节下已存在同名知识点" },
          { status: 400 }
        );
      }
    }

    // 更新知识点
    await db.update(knowledgePoints)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(knowledgePoints.id, id));

    // 获取更新后的知识点信息
    const result = await db.select({
      id: knowledgePoints.id,
      chapterId: knowledgePoints.chapterId,
      chapterName: chapters.name,
      disciplineId: chapters.disciplineId,
      disciplineName: nursingDisciplines.name,
      subjectId: knowledgePoints.subjectId,
      subjectName: examSubjects.name,
      title: knowledgePoints.title,
      content: knowledgePoints.content,
      difficulty: knowledgePoints.difficulty,
      importance: knowledgePoints.importance,
      keywords: knowledgePoints.keywords,
      tags: knowledgePoints.tags,
      createdAt: knowledgePoints.createdAt,
      updatedAt: knowledgePoints.updatedAt,
    })
    .from(knowledgePoints)
    .leftJoin(chapters, eq(knowledgePoints.chapterId, chapters.id))
    .leftJoin(nursingDisciplines, eq(chapters.disciplineId, nursingDisciplines.id))
    .leftJoin(examSubjects, eq(knowledgePoints.subjectId, examSubjects.id))
    .where(eq(knowledgePoints.id, id))
    .execute();

    return NextResponse.json({
      success: true,
      message: "知识点更新成功",
      data: result[0],
    });
  } catch (error) {
    return handleError(error, "更新知识点");
  }
}

// 删除知识点
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员身份
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: '未授权，请重新登录' },
        { status: 401 }
      );
    }

    // 获取路由参数
    const params = await getRouteParams(context);
    const { id, isValid } = parseIdParam(params.id);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "无效的ID" },
        { status: 400 }
      );
    }

    // 检查知识点是否存在
    const knowledgePoint = await db.query.knowledgePoints.findFirst({
      where: eq(knowledgePoints.id, id),
    });

    if (!knowledgePoint) {
      return NextResponse.json(
        { success: false, message: "知识点不存在" },
        { status: 404 }
      );
    }

    // 检查知识点是否有关联的试题
    const quizQuestionCount = await db
      .select({ count: count() })
      .from(quizQuestions)
      .where(eq(quizQuestions.knowledgePointId, id))
      .execute();

    if (quizQuestionCount[0]?.count > 0) {
      console.log(`知识点 ${id} 下有 ${quizQuestionCount[0].count} 个试题，不能删除`);
      return NextResponse.json(
        { success: false, message: "该知识点关联了试题，请先删除关联的试题" },
        { status: 400 }
      );
    }

    // 删除知识点
    await db.delete(knowledgePoints).where(eq(knowledgePoints.id, id));

    return NextResponse.json({
      success: true,
      message: "知识点删除成功",
    });
  } catch (error) {
    return handleError(error, "删除知识点");
  }
} 