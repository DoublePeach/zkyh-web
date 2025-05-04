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
import { getAdminSession } from "@/lib/auth/admin-auth";

// 请求验证Schema
const nursingDisciplineSchema = z.object({
  name: z.string().min(1, "学科名称不能为空"),
  description: z.string().min(1, "学科描述不能为空"),
});

/**
 * 安全获取路由参数
 * @param context 路由上下文
 * @returns 路由参数对象
 */
async function getRouteParams(context: { params: any }): Promise<Record<string, string>> {
  try {
    // 如果参数是Promise，则等待解析
    if (context.params instanceof Promise) {
      return await context.params;
    }
    // 否则直接返回
    return context.params;
  } catch (error) {
    console.error("获取路由参数失败:", error);
    return {};
  }
}

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

// 获取单个护理学科
export async function GET(
  req: NextRequest,
  context: { params: any }
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

    // 安全获取路由参数
    const params = await getRouteParams(context);
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
    return handleError(error, "获取护理学科");
  }
}

// 更新护理学科
export async function PUT(
  req: NextRequest,
  context: { params: any }
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

    // 安全获取路由参数
    const params = await getRouteParams(context);
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
    return handleError(error, "更新护理学科");
  }
}

// 删除护理学科
export async function DELETE(
  req: NextRequest,
  context: { params: any }
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

    // 安全获取路由参数
    const params = await getRouteParams(context);
    console.log("删除护理学科, params:", params);
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
    const chapterCount = await db
      .select({ count: count() })
      .from(chapters)
      .where(eq(chapters.disciplineId, disciplineId))
      .execute();
    
    if (chapterCount[0]?.count > 0) {
      console.log(`护理学科 ${disciplineId} 下有 ${chapterCount[0].count} 个章节，不能删除`);
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
    return handleError(error, "删除护理学科");
  }
} 