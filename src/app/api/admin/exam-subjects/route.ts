/**
 * @description 考试科目管理API
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { NextResponse } from "next/server";
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

// 获取所有考试科目
export async function GET() {
  try {
    const subjects = await db.query.examSubjects.findMany({
      orderBy: (subjects, { asc }) => [asc(subjects.id)],
    });

    return NextResponse.json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    console.error("获取考试科目失败:", error);
    return NextResponse.json(
      { success: false, message: "获取考试科目失败" },
      { status: 500 }
    );
  }
}

// 创建新的考试科目
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = examSubjectSchema.parse(body);

    // 检查科目名称是否已存在
    const existingSubject = await db.query.examSubjects.findFirst({
      where: eq(examSubjects.name, validatedData.name),
    });

    if (existingSubject) {
      return NextResponse.json(
        { success: false, message: "科目名称已存在" },
        { status: 400 }
      );
    }

    // 插入新科目
    const now = new Date();
    const result = await db.insert(examSubjects).values({
      ...validatedData,
      createdAt: now,
      updatedAt: now,
    }).returning();

    const newSubject = result[0];

    return NextResponse.json({
      success: true,
      message: "考试科目创建成功",
      data: newSubject,
    }, { status: 201 });
  } catch (error) {
    console.error("创建考试科目失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "数据验证失败", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "创建考试科目失败" },
      { status: 500 }
    );
  }
} 