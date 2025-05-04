/**
 * @description 单个考试科目管理API
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { examSubjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// 请求验证Schema
const examSubjectSchema = z.object({
  name: z.string().min(1, "科目名称不能为空"),
  description: z.string().min(1, "科目描述不能为空"),
  weight: z.string().min(1, "考试权重不能为空").regex(/^\d+%$/, "权重格式应为数字加百分号，如45%"),
});

// 获取单个考试科目
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const subjectId = parseInt(id);
    
    if (isNaN(subjectId)) {
      return NextResponse.json(
        { success: false, message: "无效的ID" },
        { status: 400 }
      );
    }

    const subject = await db.query.examSubjects.findFirst({
      where: eq(examSubjects.id, subjectId),
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, message: "考试科目不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: subject,
    });
  } catch (error) {
    console.error("获取考试科目失败:", error);
    return NextResponse.json(
      { success: false, message: "获取考试科目失败" },
      { status: 500 }
    );
  }
}

// 更新考试科目
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const subjectId = parseInt(id);
    
    if (isNaN(subjectId)) {
      return NextResponse.json(
        { success: false, message: "无效的ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = examSubjectSchema.parse(body);

    // 检查科目是否存在
    const existingSubject = await db.query.examSubjects.findFirst({
      where: eq(examSubjects.id, subjectId),
    });

    if (!existingSubject) {
      return NextResponse.json(
        { success: false, message: "考试科目不存在" },
        { status: 404 }
      );
    }

    // 如果更新名称，检查名称是否已被其他科目使用
    if (validatedData.name !== existingSubject.name) {
      const nameExists = await db.query.examSubjects.findFirst({
        where: eq(examSubjects.name, validatedData.name),
      });

      if (nameExists) {
        return NextResponse.json(
          { success: false, message: "科目名称已存在" },
          { status: 400 }
        );
      }
    }

    // 更新科目
    await db.update(examSubjects)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(examSubjects.id, subjectId));

    // 获取更新后的科目
    const updatedSubject = await db.query.examSubjects.findFirst({
      where: eq(examSubjects.id, subjectId),
    });

    return NextResponse.json({
      success: true,
      message: "考试科目更新成功",
      data: updatedSubject,
    });
  } catch (error) {
    console.error("更新考试科目失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "数据验证失败", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "更新考试科目失败" },
      { status: 500 }
    );
  }
}

// 删除考试科目
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const subjectId = parseInt(id);
    
    if (isNaN(subjectId)) {
      return NextResponse.json(
        { success: false, message: "无效的ID" },
        { status: 400 }
      );
    }

    // 检查科目是否存在
    const subject = await db.query.examSubjects.findFirst({
      where: eq(examSubjects.id, subjectId),
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, message: "考试科目不存在" },
        { status: 404 }
      );
    }

    // TODO: 检查是否有关联的知识点或题库，如果有则不允许删除

    // 删除科目
    await db.delete(examSubjects).where(eq(examSubjects.id, subjectId));

    return NextResponse.json({
      success: true,
      message: "考试科目删除成功",
    });
  } catch (error) {
    console.error("删除考试科目失败:", error);
    return NextResponse.json(
      { success: false, message: "删除考试科目失败" },
      { status: 500 }
    );
  }
} 