/**
 * @description 章节管理API
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chapters, nursingDisciplines } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// 请求验证Schema
const chapterSchema = z.object({
  disciplineId: z.number().int().positive("护理学科ID必须是正整数"),
  name: z.string().min(1, "章节名称不能为空"),
  description: z.string().min(1, "章节描述不能为空"),
  orderIndex: z.number().int().positive("章节顺序必须是正整数"),
});

// 获取所有章节，可按学科过滤
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const disciplineId = searchParams.get('disciplineId');
    
    let chaptersData;
    
    if (disciplineId) {
      const discId = parseInt(disciplineId);
      if (isNaN(discId)) {
        return NextResponse.json(
          { success: false, message: "无效的学科ID" },
          { status: 400 }
        );
      }
      
      // 检查学科是否存在
      const discipline = await db.query.nursingDisciplines.findFirst({
        where: eq(nursingDisciplines.id, discId),
      });
      
      if (!discipline) {
        return NextResponse.json(
          { success: false, message: "护理学科不存在" },
          { status: 404 }
        );
      }
      
      // 按学科过滤章节 - 修复关联查询
      const results = await db.select({
        id: chapters.id,
        disciplineId: chapters.disciplineId,
        name: chapters.name,
        description: chapters.description,
        orderIndex: chapters.orderIndex,
        createdAt: chapters.createdAt,
        updatedAt: chapters.updatedAt,
        disciplineName: nursingDisciplines.name
      })
      .from(chapters)
      .leftJoin(nursingDisciplines, eq(chapters.disciplineId, nursingDisciplines.id))
      .where(eq(chapters.disciplineId, discId))
      .orderBy(chapters.orderIndex, chapters.id);
      
      chaptersData = results;
    } else {
      // 获取所有章节 - 修复关联查询
      const results = await db.select({
        id: chapters.id,
        disciplineId: chapters.disciplineId,
        name: chapters.name,
        description: chapters.description,
        orderIndex: chapters.orderIndex,
        createdAt: chapters.createdAt,
        updatedAt: chapters.updatedAt,
        disciplineName: nursingDisciplines.name
      })
      .from(chapters)
      .leftJoin(nursingDisciplines, eq(chapters.disciplineId, nursingDisciplines.id))
      .orderBy(chapters.disciplineId, chapters.orderIndex, chapters.id);
      
      chaptersData = results;
    }

    return NextResponse.json({
      success: true,
      data: chaptersData,
    });
  } catch (error) {
    console.error("获取章节失败:", error);
    return NextResponse.json(
      { success: false, message: "获取章节失败", error: String(error) },
      { status: 500 }
    );
  }
}

// 创建新的章节
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = chapterSchema.parse(body);

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

    // 检查章节名称是否在同一学科下已存在
    const existingChapter = await db.query.chapters.findFirst({
      where: and(
        eq(chapters.disciplineId, validatedData.disciplineId),
        eq(chapters.name, validatedData.name)
      ),
    });

    if (existingChapter) {
      return NextResponse.json(
        { success: false, message: "该学科下已存在同名章节" },
        { status: 400 }
      );
    }

    // 检查章节序号是否在同一学科下已存在
    const existingOrder = await db.query.chapters.findFirst({
      where: and(
        eq(chapters.disciplineId, validatedData.disciplineId),
        eq(chapters.orderIndex, validatedData.orderIndex)
      ),
    });

    if (existingOrder) {
      return NextResponse.json(
        { success: false, message: "该学科下已存在相同序号的章节" },
        { status: 400 }
      );
    }

    // 插入新章节
    const now = new Date();
    const result = await db.insert(chapters).values({
      ...validatedData,
      createdAt: now,
      updatedAt: now,
    }).returning();

    const newChapter = result[0];

    return NextResponse.json({
      success: true,
      message: "章节创建成功",
      data: {
        ...newChapter,
        disciplineName: discipline.name
      },
    }, { status: 201 });
  } catch (error) {
    console.error("创建章节失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "数据验证失败", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "创建章节失败" },
      { status: 500 }
    );
  }
} 