/**
 * @description 单个护理学科管理API
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { nursingDisciplines, chapters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// 请求验证Schema
const nursingDisciplineSchema = z.object({
  name: z.string().min(1, "学科名称不能为空"),
  description: z.string().min(1, "学科描述不能为空"),
  imageUrl: z.string().optional(),
});

// 获取单个护理学科
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

    const discipline = await db.query.nursingDisciplines.findFirst({
      where: eq(nursingDisciplines.id, id),
    });

    if (!discipline) {
      return NextResponse.json(
        { success: false, message: "护理学科不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: discipline,
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
    const validatedData = nursingDisciplineSchema.parse(body);

    // 检查学科是否存在
    const existingDiscipline = await db.query.nursingDisciplines.findFirst({
      where: eq(nursingDisciplines.id, id),
    });

    if (!existingDiscipline) {
      return NextResponse.json(
        { success: false, message: "护理学科不存在" },
        { status: 404 }
      );
    }

    // 如果更新名称，检查名称是否已被其他学科使用
    if (validatedData.name !== existingDiscipline.name) {
      const nameExists = await db.query.nursingDisciplines.findFirst({
        where: eq(nursingDisciplines.name, validatedData.name),
      });

      if (nameExists) {
        return NextResponse.json(
          { success: false, message: "学科名称已存在" },
          { status: 400 }
        );
      }
    }

    // 更新学科
    await db.update(nursingDisciplines)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(nursingDisciplines.id, id));

    // 获取更新后的学科
    const updatedDiscipline = await db.query.nursingDisciplines.findFirst({
      where: eq(nursingDisciplines.id, id),
    });

    return NextResponse.json({
      success: true,
      message: "护理学科更新成功",
      data: updatedDiscipline,
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

    // 检查学科是否存在
    const discipline = await db.query.nursingDisciplines.findFirst({
      where: eq(nursingDisciplines.id, id),
    });

    if (!discipline) {
      return NextResponse.json(
        { success: false, message: "护理学科不存在" },
        { status: 404 }
      );
    }

    // 检查是否有关联的章节，如果有则不允许删除
    const relatedChapters = await db.query.chapters.findMany({
      where: eq(chapters.disciplineId, id),
      limit: 1,
    });

    if (relatedChapters.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "该学科下存在章节内容，不能删除。请先删除相关章节后再尝试。" 
        },
        { status: 400 }
      );
    }

    // 删除学科
    await db.delete(nursingDisciplines).where(eq(nursingDisciplines.id, id));

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