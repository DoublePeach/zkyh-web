/**
 * @description 章节管理API
 * @author 郝桃桃
 * @date 2024-06-17
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chapters, nursingDisciplines } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { withAdminAuth } from "@/lib/auth/admin-auth";

// 请求验证Schema
const chapterSchema = z.object({
  disciplineId: z.number().int().positive("护理学科ID必须是正整数"),
  name: z.string().min(1, "章节名称不能为空"),
  description: z.string().min(1, "章节描述不能为空"),
  orderIndex: z.number().int().positive("章节顺序必须是正整数"),
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

// 获取所有章节，可按学科过滤
export const GET = withAdminAuth(async (req: NextRequest) => {
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
    return handleError(error, "获取章节");
  }
});

// 创建新的章节
export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    console.log("收到创建章节请求:", body);
    
    try {
      const validatedData = chapterSchema.parse(body);
      console.log("章节数据验证通过:", validatedData);
      
      // 检查学科是否存在
      const discipline = await db.query.nursingDisciplines.findFirst({
        where: eq(nursingDisciplines.id, validatedData.disciplineId),
      });

      if (!discipline) {
        console.log("学科不存在:", validatedData.disciplineId);
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
        console.log("同名章节已存在:", validatedData.name);
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
        console.log("相同序号章节已存在:", validatedData.orderIndex);
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
      console.log("章节创建成功:", newChapter);

      return NextResponse.json({
        success: true,
        message: "章节创建成功",
        data: {
          ...newChapter,
          disciplineName: discipline.name
        },
      }, { status: 201 });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error("章节数据验证失败:", validationError.errors);
        return NextResponse.json(
          { 
            success: false, 
            message: "数据验证失败", 
            error: "提交的章节数据无效",
            details: validationError.errors 
          },
          { status: 400 }
        );
      }
      throw validationError;
    }
  } catch (error) {
    return handleError(error, "创建章节");
  }
}); 