/**
 * @description 单个章节管理API
 * @author 郝桃桃
 * @date 2024-06-17
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chapters, nursingDisciplines, knowledgePoints } from "@/db/schema";
import { eq, and, ne, count } from "drizzle-orm";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/admin-auth";
import { getRouteParams, parseIdParam } from "@/lib/utils/route-utils";

// 请求验证Schema
const chapterSchema = z.object({
  name: z.string().min(1, "章节名称不能为空"),
  description: z.string().min(1, "章节描述不能为空"),
  disciplineId: z.number().int().positive("护理学科ID必须是正整数"),
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
  
  return NextResponse.json(
    { success: false, message: `${operation}失败`, error: String(error) },
    { status: 500 }
  );
}

// 获取单个章节
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

    // 获取章节信息，包含学科信息
    const chapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, id),
    });

    if (!chapter) {
      return NextResponse.json(
        { success: false, message: "章节不存在" },
        { status: 404 }
      );
    }

    // 获取学科名称
    const discipline = await db.query.nursingDisciplines.findFirst({
      where: eq(nursingDisciplines.id, chapter.disciplineId),
    });

    // 获取知识点数量
    const knowledgePointCount = await db
      .select({ count: count() })
      .from(knowledgePoints)
      .where(eq(knowledgePoints.chapterId, id))
      .execute();

    return NextResponse.json({
      success: true,
      data: {
        ...chapter,
        disciplineName: discipline?.name || "",
        knowledgePointCount: knowledgePointCount[0]?.count || 0,
      },
    });
  } catch (error) {
    return handleError(error, "获取章节");
  }
}

// 更新章节
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
    const validatedData = chapterSchema.parse(body);

    // 检查章节是否存在
    const existingChapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, id),
    });

    if (!existingChapter) {
      return NextResponse.json(
        { success: false, message: "章节不存在" },
        { status: 404 }
      );
    }

    // 检查护理学科是否存在
    const discipline = await db.query.nursingDisciplines.findFirst({
      where: eq(nursingDisciplines.id, validatedData.disciplineId),
    });

    if (!discipline) {
      return NextResponse.json(
        { success: false, message: "所选护理学科不存在" },
        { status: 400 }
      );
    }

    // 如果更改了学科或名称，检查新学科下是否已存在同名章节
    if (
      validatedData.disciplineId !== existingChapter.disciplineId ||
      validatedData.name !== existingChapter.name
    ) {
      const nameExists = await db.query.chapters.findFirst({
        where: and(
          eq(chapters.disciplineId, validatedData.disciplineId),
          eq(chapters.name, validatedData.name),
          ne(chapters.id, id)
        ),
      });

      if (nameExists) {
        return NextResponse.json(
          { success: false, message: "该护理学科下已存在同名章节" },
          { status: 400 }
        );
      }
    }

    // 更新章节
    await db.update(chapters)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(chapters.id, id));

    // 获取更新后的章节信息
    const updatedChapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, id),
    });

    // 获取学科名称
    const disciplineName = discipline.name;

    // 获取知识点数量
    const knowledgePointCount = await db
      .select({ count: count() })
      .from(knowledgePoints)
      .where(eq(knowledgePoints.chapterId, id))
      .execute();

    return NextResponse.json({
      success: true,
      message: "章节更新成功",
      data: {
        ...updatedChapter,
        disciplineName,
        knowledgePointCount: knowledgePointCount[0]?.count || 0,
      },
    });
  } catch (error) {
    return handleError(error, "更新章节");
  }
}

// 删除章节
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

    // 检查章节是否存在
    const chapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, id),
    });

    if (!chapter) {
      return NextResponse.json(
        { success: false, message: "章节不存在" },
        { status: 404 }
      );
    }

    // 检查章节是否有关联的知识点
    const knowledgePointCount = await db
      .select({ count: count() })
      .from(knowledgePoints)
      .where(eq(knowledgePoints.chapterId, id))
      .execute();

    if (knowledgePointCount[0]?.count > 0) {
      console.log(`章节 ${id} 下有 ${knowledgePointCount[0].count} 个知识点，不能删除`);
      return NextResponse.json(
        { success: false, message: "章节下有知识点，请先删除所有关联的知识点" },
        { status: 400 }
      );
    }

    // 删除章节
    await db.delete(chapters).where(eq(chapters.id, id));

    return NextResponse.json({
      success: true,
      message: "章节删除成功",
    });
  } catch (error) {
    return handleError(error, "删除章节");
  }
} 