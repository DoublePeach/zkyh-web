/**
 * @description 题库管理API
 * @author 郝桃桃
 * @date 2024-05-25
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { testBanks, examSubjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// 请求验证Schema
const testBankSchema = z.object({
  name: z.string().min(1, "题库名称不能为空"),
  description: z.string().min(1, "题库描述不能为空"),
  type: z.string().min(1, "请选择题库类型"),
  year: z.number().int().nullable().optional(),
  subjectId: z.number().int().positive("考试科目ID必须是正整数"),
});

// 获取所有题库
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');
    const type = searchParams.get('type');
    
    // 手动构建SQL查询
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
        1=1
        ${subjectId ? ` AND tb.subject_id = ${parseInt(subjectId)}` : ''}
        ${type ? ` AND tb.type = '${type}'` : ''}
      GROUP BY 
        tb.id, es.name
      ORDER BY 
        tb.created_at DESC
    `;
    
    // 执行原始SQL查询
    const results = await db.execute(query);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("获取题库失败:", error);
    return NextResponse.json(
      { success: false, message: "获取题库失败", error: String(error) },
      { status: 500 }
    );
  }
}

// 创建新的题库
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = testBankSchema.parse(body);

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

    // 检查题库名称是否已存在
    const existingBank = await db.query.testBanks.findFirst({
      where: eq(testBanks.name, validatedData.name),
    });

    if (existingBank) {
      return NextResponse.json(
        { success: false, message: "已存在同名题库" },
        { status: 400 }
      );
    }

    // 插入新题库
    const now = new Date();
    const result = await db.insert(testBanks).values({
      ...validatedData,
      totalQuestions: 0, // 新建题库默认题目数为0
      createdAt: now,
      updatedAt: now,
    }).returning();

    const newTestBank = result[0];

    return NextResponse.json({
      success: true,
      message: "题库创建成功",
      data: {
        ...newTestBank,
        subjectName: subject.name,
        actualQuestionCount: 0
      },
    }, { status: 201 });
  } catch (error) {
    console.error("创建题库失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "数据验证失败", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "创建题库失败" },
      { status: 500 }
    );
  }
} 