/**
 * @description 单个题库管理API
 * @author 郝桃桃
 * @date 2024-06-17
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { testBanks, examSubjects, quizQuestions } from "@/db/schema";
import { eq, and, ne, count } from "drizzle-orm";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/admin-auth";
import { getRouteParams, parseIdParam } from "@/lib/utils/route-utils";

// 请求验证Schema
const testBankSchema = z.object({
  name: z.string().min(1, "题库名称不能为空"),
  description: z.string().min(1, "题库描述不能为空"),
  type: z.string().min(1, "请选择题库类型"),
  year: z.number().int().nullable().optional(),
  subjectId: z.number().int().positive("考试科目ID必须是正整数"),
});

// 获取单个题库
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // 验证管理员身份
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: '未授权，请重新登录' },
        { status: 401 }
      );
    }
    
    const params = await getRouteParams(context);
    const { id, isValid } = parseIdParam(params.id);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "无效的ID" },
        { status: 400 }
      );
    }

    // 使用SQL字符串查询获取题库及关联信息
    const query = `
      SELECT 
        tb.id,
        tb.name,
        tb.description,
        tb.type,
        tb.year,
        tb.subject_id AS "subjectId",
        es.name AS "subjectName",
        tb.total_questions AS "totalQuestions",
        tb.created_at AS "createdAt",
        tb.updated_at AS "updatedAt",
        COUNT(qq.id) AS "actualQuestionCount"
      FROM 
        test_banks tb
      LEFT JOIN 
        exam_subjects es ON tb.subject_id = es.id
      LEFT JOIN 
        quiz_questions qq ON tb.id = qq.test_bank_id
      WHERE 
        tb.id = ${id}
      GROUP BY 
        tb.id, es.name
    `;
    
    const result = await db.execute(query);

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: "题库不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("获取题库失败:", error);
    return NextResponse.json(
      { success: false, message: "获取题库失败" },
      { status: 500 }
    );
  }
}

// 更新题库
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // 验证管理员身份
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: '未授权，请重新登录' },
        { status: 401 }
      );
    }
    
    const params = await getRouteParams(context);
    const { id, isValid } = parseIdParam(params.id);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "无效的ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = testBankSchema.parse(body);

    // 检查题库是否存在
    const existingBank = await db.query.testBanks.findFirst({
      where: eq(testBanks.id, id),
    });

    if (!existingBank) {
      return NextResponse.json(
        { success: false, message: "题库不存在" },
        { status: 404 }
      );
    }

    // 检查考试科目是否存在
    const subject = await db.query.examSubjects.findFirst({
      where: eq(examSubjects.id, validatedData.subjectId),
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, message: "所选考试科目不存在" },
        { status: 400 }
      );
    }

    // 如果更改了名称，检查是否已存在同名题库
    if (validatedData.name !== existingBank.name) {
      const nameExists = await db.query.testBanks.findFirst({
        where: and(
          eq(testBanks.name, validatedData.name),
          ne(testBanks.id, id)
        ),
      });

      if (nameExists) {
        return NextResponse.json(
          { success: false, message: "已存在同名题库" },
          { status: 400 }
        );
      }
    }

    // 获取题库当前题目数量
    const questionCount = await db
      .select({ count: count() })
      .from(quizQuestions)
      .where(eq(quizQuestions.testBankId, id))
      .execute();

    const totalQuestions = questionCount[0]?.count || 0;

    // 更新题库
    await db.update(testBanks)
      .set({
        ...validatedData,
        totalQuestions, // 更新为实际题目数量
        updatedAt: new Date(),
      })
      .where(eq(testBanks.id, id));

    // 获取更新后的题库信息
    const query = `
      SELECT 
        tb.id,
        tb.name,
        tb.description,
        tb.type,
        tb.year,
        tb.subject_id AS "subjectId",
        es.name AS "subjectName",
        tb.total_questions AS "totalQuestions",
        tb.created_at AS "createdAt",
        tb.updated_at AS "updatedAt",
        COUNT(qq.id) AS "actualQuestionCount"
      FROM 
        test_banks tb
      LEFT JOIN 
        exam_subjects es ON tb.subject_id = es.id
      LEFT JOIN 
        quiz_questions qq ON tb.id = qq.test_bank_id
      WHERE 
        tb.id = ${id}
      GROUP BY 
        tb.id, es.name
    `;
    
    const result = await db.execute(query);

    return NextResponse.json({
      success: true,
      message: "题库更新成功",
      data: result[0],
    });
  } catch (error) {
    console.error("更新题库失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "数据验证失败", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "更新题库失败" },
      { status: 500 }
    );
  }
}

// 删除题库
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // 验证管理员身份
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: '未授权，请重新登录' },
        { status: 401 }
      );
    }
    
    const params = await getRouteParams(context);
    const { id, isValid } = parseIdParam(params.id);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "无效的ID" },
        { status: 400 }
      );
    }

    // 检查题库是否存在
    const testBank = await db.query.testBanks.findFirst({
      where: eq(testBanks.id, id),
    });

    if (!testBank) {
      return NextResponse.json(
        { success: false, message: "题库不存在" },
        { status: 404 }
      );
    }

    // 检查题库是否有关联的试题
    const questionCount = await db
      .select({ count: count() })
      .from(quizQuestions)
      .where(eq(quizQuestions.testBankId, id))
      .execute();

    if (questionCount[0]?.count > 0) {
      return NextResponse.json(
        { success: false, message: "题库中包含试题，请先删除相关试题" },
        { status: 400 }
      );
    }

    // 删除题库
    await db.delete(testBanks).where(eq(testBanks.id, id));

    return NextResponse.json({
      success: true,
      message: "题库删除成功",
    });
  } catch (error) {
    console.error("删除题库失败:", error);
    return NextResponse.json(
      { success: false, message: "删除题库失败" },
      { status: 500 }
    );
  }
} 