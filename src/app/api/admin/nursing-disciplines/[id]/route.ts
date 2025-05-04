/**
 * @description 单个护理学科管理API
 * @author 郝桃桃
 * @date 2024-05-25
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { nursingDisciplines, chapters } from "@/db/schema";
import { eq, and, ne, count } from "drizzle-orm";
import { z } from "zod";

// 请求验证Schema
const nursingDisciplineSchema = z.object({
  name: z.string().min(1, "学科名称不能为空"),
  description: z.string().min(1, "学科描述不能为空"),
});

// 获取单个护理学科
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const disciplineId = parseInt(id);
    
    if (isNaN(disciplineId)) {
      return NextResponse.json(
        { success: false, message: "无效的ID" },
        { status: 400 }
      );
    }

    // 获取护理学科信息
    const discipline = await db.query.nursingDisciplines.findFirst({
      where: eq(nursingDisciplines.id, disciplineId),
    });

    if (!discipline) {
      return NextResponse.json(
        { success: false, message: "护理学科不存在" },
        { status: 404 }
      );
    }

    // 获取章节数量
    const chapterCount = await db
      .select({ count: count() })
      .from(chapters)
      .where(eq(chapters.disciplineId, disciplineId))
      .execute();

    return NextResponse.json({
      success: true,
      data: {
        ...discipline,
        chapterCount: chapterCount[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error("获取护理学科失败:", error);
    return NextResponse.json(
      { success: false, message: "获取护理学科失败" },
      { status: 500 }
    );
  }
}

// 更新护理学科
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const disciplineId = parseInt(id);
    
    if (isNaN(disciplineId)) {
      return NextResponse.json(
        { success: false, message: "无效的ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = nursingDisciplineSchema.parse(body);

    // 检查护理学科是否存在
    const existingDiscipline = await db.query.nursingDisciplines.findFirst({
      where: eq(nursingDisciplines.id, disciplineId),
    });

    if (!existingDiscipline) {
      return NextResponse.json(
        { success: false, message: "护理学科不存在" },
        { status: 404 }
      );
    }

    // 如果更改了名称，检查是否已存在同名学科
    if (validatedData.name !== existingDiscipline.name) {
      const nameExists = await db.query.nursingDisciplines.findFirst({
        where: and(
          eq(nursingDisciplines.name, validatedData.name),
          ne(nursingDisciplines.id, disciplineId)
        ),
      });

      if (nameExists) {
        return NextResponse.json(
          { success: false, message: "已存在同名护理学科" },
          { status: 400 }
        );
      }
    }

    // 更新护理学科
    await db.update(nursingDisciplines)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(nursingDisciplines.id, disciplineId));

    // 获取更新后的护理学科信息
    const updatedDiscipline = await db.query.nursingDisciplines.findFirst({
      where: eq(nursingDisciplines.id, disciplineId),
    });

    // 获取章节数量
    const chapterCount = await db
      .select({ count: count() })
      .from(chapters)
      .where(eq(chapters.disciplineId, disciplineId))
      .execute();

    return NextResponse.json({
      success: true,
      message: "护理学科更新成功",
      data: {
        ...updatedDiscipline,
        chapterCount: chapterCount[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error("更新护理学科失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "数据验证失败", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "更新护理学科失败" },
      { status: 500 }
    );
  }
}

// 删除护理学科
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const disciplineId = parseInt(id);
    
    if (isNaN(disciplineId)) {
      return NextResponse.json(
        { success: false, message: "无效的ID" },
        { status: 400 }
      );
    }

    // 检查护理学科是否存在
    const discipline = await db.query.nursingDisciplines.findFirst({
      where: eq(nursingDisciplines.id, disciplineId),
    });

    if (!discipline) {
      return NextResponse.json(
        { success: false, message: "护理学科不存在" },
        { status: 404 }
      );
    }

    // 检查是否有关联的章节
    const hasChapters = await db.query.chapters.findFirst({
      where: eq(chapters.disciplineId, disciplineId),
    });

    if (hasChapters) {
      return NextResponse.json(
        { success: false, message: "该护理学科下有章节内容，请先删除所有关联的章节" },
        { status: 400 }
      );
    }

    // 删除护理学科
    await db.delete(nursingDisciplines).where(eq(nursingDisciplines.id, disciplineId));

    return NextResponse.json({
      success: true,
      message: "护理学科删除成功",
    });
  } catch (error) {
    console.error("删除护理学科失败:", error);
    return NextResponse.json(
      { success: false, message: "删除护理学科失败" },
      { status: 500 }
    );
  }
} 