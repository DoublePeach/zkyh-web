/**
 * @description 护理学科管理API
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { NextResponse } from "next/server";
import { db } from "@/db";
import { nursingDisciplines } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// 请求验证Schema
const nursingDisciplineSchema = z.object({
  name: z.string().min(1, "学科名称不能为空"),
  description: z.string().min(1, "学科描述不能为空"),
  imageUrl: z.string().optional(),
});

// 获取所有护理学科
export async function GET() {
  try {
    const disciplines = await db.query.nursingDisciplines.findMany({
      orderBy: (disciplines, { asc }) => [asc(disciplines.id)],
    });

    return NextResponse.json({
      success: true,
      data: disciplines,
    });
  } catch (error) {
    console.error("获取护理学科失败:", error);
    return NextResponse.json(
      { success: false, message: "获取护理学科失败" },
      { status: 500 }
    );
  }
}

// 创建新的护理学科
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = nursingDisciplineSchema.parse(body);

    // 检查学科名称是否已存在
    const existingDiscipline = await db.query.nursingDisciplines.findFirst({
      where: eq(nursingDisciplines.name, validatedData.name),
    });

    if (existingDiscipline) {
      return NextResponse.json(
        { success: false, message: "学科名称已存在" },
        { status: 400 }
      );
    }

    // 插入新学科
    const now = new Date();
    const result = await db.insert(nursingDisciplines).values({
      ...validatedData,
      createdAt: now,
      updatedAt: now,
    }).returning();

    const newDiscipline = result[0];

    return NextResponse.json({
      success: true,
      message: "护理学科创建成功",
      data: newDiscipline,
    }, { status: 201 });
  } catch (error) {
    console.error("创建护理学科失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "数据验证失败", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "创建护理学科失败" },
      { status: 500 }
    );
  }
} 