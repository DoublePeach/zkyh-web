/**
 * @description 单个章节管理API
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chapters, knowledgePoints, nursingDisciplines } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { z } from "zod";

// 请求验证Schema
const chapterSchema = z.object({
  disciplineId: z.number().int().positive("护理学科ID必须是正整数"),
  name: z.string().min(1, "章节名称不能为空"),
  description: z.string().min(1, "章节描述不能为空"),
  orderIndex: z.number().int().positive("章节顺序必须是正整数"),
});

// 获取单个章节
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
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
      .select({ count: knowledgePoints.id })
      .from(knowledgePoints)
      .where(eq(knowledgePoints.chapterId, id))
      .execute();

    return NextResponse.json({
      success: true,
      data: {
        ...chapter,
        disciplineName: discipline?.name || "",
        knowledgePointCount: knowledgePointCount.length || 0,
      },
    });
  } catch (error) {
    console.error("获取章节失败:", error);
    return NextResponse.json(
      { success: false, message: "获取章节失败" },
      { status: 500 }
    );
  }
}

// 更新章节
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
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

    // 检查学科是否存在
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
          { success: false, message: "该学科下已存在同名章节" },
          { status: 400 }
        );
      }
    }

    // 如果更改了学科或序号，检查新学科下是否已存在相同序号的章节
    if (
      validatedData.disciplineId !== existingChapter.disciplineId ||
      validatedData.orderIndex !== existingChapter.orderIndex
    ) {
      const orderExists = await db.query.chapters.findFirst({
        where: and(
          eq(chapters.disciplineId, validatedData.disciplineId),
          eq(chapters.orderIndex, validatedData.orderIndex),
          ne(chapters.id, id)
        ),
      });

      if (orderExists) {
        return NextResponse.json(
          { success: false, message: "该学科下已存在相同序号的章节" },
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

    // 获取更新后的章节
    const updatedChapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, id),
    });

    return NextResponse.json({
      success: true,
      message: "章节更新成功",
      data: {
        ...updatedChapter,
        disciplineName: discipline.name,
      },
    });
  } catch (error) {
    console.error("更新章节失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "数据验证失败", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "更新章节失败" },
      { status: 500 }
    );
  }
}

// 删除章节
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
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

    // 检查是否有关联的知识点，如果有则不允许删除
    const relatedKnowledgePoints = await db.query.knowledgePoints.findMany({
      where: eq(knowledgePoints.chapterId, id),
      limit: 1,
    });

    if (relatedKnowledgePoints.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "该章节下存在知识点内容，不能删除。请先删除相关知识点后再尝试。",
        },
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
    console.error("删除章节失败:", error);
    return NextResponse.json(
      { success: false, message: "删除章节失败" },
      { status: 500 }
    );
  }
} 