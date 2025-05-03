/**
 * @description 试题管理API
 * @author 郝桃桃
 * @date 2024-05-26
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quizQuestions, testBanks, knowledgePoints } from "@/db/schema";
import { eq, and, SQL } from "drizzle-orm";
import { z } from "zod";

// 请求验证Schema
const quizQuestionSchema = z.object({
  testBankId: z.number().int().positive("题库ID必须是正整数"),
  knowledgePointId: z.number().int().positive("知识点ID必须是正整数").optional().nullable(),
  questionType: z.string().min(1, "请选择题目类型"),
  content: z.string().min(1, "题目内容不能为空"),
  options: z.any(),
  correctAnswer: z.string().min(1, "正确答案不能为空"),
  explanation: z.string().min(1, "题目解析不能为空"),
  difficulty: z.number().int().min(1).max(5, "难度级别必须在1-5之间"),
});

// 批量创建请求验证Schema
const bulkCreateSchema = z.object({
  questions: z.array(quizQuestionSchema),
});

// 获取试题列表
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const testBankId = searchParams.get('testBankId');
    
    if (!testBankId) {
      return NextResponse.json(
        { success: false, message: "缺少必要的题库ID参数" },
        { status: 400 }
      );
    }
    
    // 检查题库是否存在
    const bank = await db.query.testBanks.findFirst({
      where: eq(testBanks.id, parseInt(testBankId)),
    });

    if (!bank) {
      return NextResponse.json(
        { success: false, message: "题库不存在" },
        { status: 404 }
      );
    }
    
    // 构建SQL查询
    const query = `
      SELECT 
        qq.id,
        qq.test_bank_id AS "testBankId",
        qq.knowledge_point_id AS "knowledgePointId",
        kp.title AS "knowledgePointTitle",
        qq.question_type AS "questionType",
        qq.content,
        qq.options,
        qq.correct_answer AS "correctAnswer",
        qq.explanation,
        qq.difficulty,
        qq.created_at AS "createdAt",
        qq.updated_at AS "updatedAt"
      FROM 
        quiz_questions qq
      LEFT JOIN 
        knowledge_points kp ON qq.knowledge_point_id = kp.id
      WHERE 
        qq.test_bank_id = ${parseInt(testBankId)}
      ORDER BY 
        qq.created_at DESC
    `;
    
    // 执行查询
    const questions = await db.execute(query);

    return NextResponse.json({
      success: true,
      data: questions,
    });
  } catch (error) {
    console.error("获取试题失败:", error);
    return NextResponse.json(
      { success: false, message: "获取试题失败", error: String(error) },
      { status: 500 }
    );
  }
}

// 创建新试题
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = quizQuestionSchema.parse(body);

    // 检查题库是否存在
    const bank = await db.query.testBanks.findFirst({
      where: eq(testBanks.id, validatedData.testBankId),
    });

    if (!bank) {
      return NextResponse.json(
        { success: false, message: "所选题库不存在" },
        { status: 400 }
      );
    }

    // 如果提供了知识点ID，检查知识点是否存在
    if (validatedData.knowledgePointId) {
      const point = await db.query.knowledgePoints.findFirst({
        where: eq(knowledgePoints.id, validatedData.knowledgePointId),
      });

      if (!point) {
        return NextResponse.json(
          { success: false, message: "所选知识点不存在" },
          { status: 400 }
        );
      }
    }

    // 插入新试题
    const now = new Date();
    const result = await db.insert(quizQuestions).values({
      ...validatedData,
      createdAt: now,
      updatedAt: now,
    }).returning();

    const newQuestion = result[0];

    // 更新题库的题目数量
    await db.execute(
      `UPDATE test_banks 
       SET total_questions = (
         SELECT COUNT(*) FROM quiz_questions 
         WHERE test_bank_id = ${validatedData.testBankId}
       ) 
       WHERE id = ${validatedData.testBankId}`
    );

    // 获取知识点标题
    let knowledgePointTitle = null;
    if (validatedData.knowledgePointId) {
      const point = await db.query.knowledgePoints.findFirst({
        where: eq(knowledgePoints.id, validatedData.knowledgePointId),
        columns: { title: true }
      });
      knowledgePointTitle = point?.title;
    }

    return NextResponse.json({
      success: true,
      message: "试题创建成功",
      data: {
        ...newQuestion,
        knowledgePointTitle
      },
    }, { status: 201 });
  } catch (error) {
    console.error("创建试题失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "数据验证失败", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "创建试题失败" },
      { status: 500 }
    );
  }
}

// 批量创建试题
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    
    // 如果是批量创建路径
    if ('questions' in body) {
      const validatedData = bulkCreateSchema.parse(body);
      const { questions } = validatedData;
      
      if (questions.length === 0) {
        return NextResponse.json(
          { success: false, message: "试题列表不能为空" },
          { status: 400 }
        );
      }
      
      // 确保所有试题属于同一个题库
      const testBankId = questions[0].testBankId;
      if (!questions.every(q => q.testBankId === testBankId)) {
        return NextResponse.json(
          { success: false, message: "批量创建的试题必须属于同一个题库" },
          { status: 400 }
        );
      }
      
      // 检查题库是否存在
      const bank = await db.query.testBanks.findFirst({
        where: eq(testBanks.id, testBankId),
      });

      if (!bank) {
        return NextResponse.json(
          { success: false, message: "所选题库不存在" },
          { status: 400 }
        );
      }
      
      // 批量插入试题
      const now = new Date();
      const valuesToInsert = questions.map(q => ({
        ...q,
        createdAt: now,
        updatedAt: now,
      }));
      
      await db.insert(quizQuestions).values(valuesToInsert);
      
      // 更新题库的题目数量
      await db.execute(
        `UPDATE test_banks 
         SET total_questions = (
           SELECT COUNT(*) FROM quiz_questions 
           WHERE test_bank_id = ${testBankId}
         ) 
         WHERE id = ${testBankId}`
      );
      
      return NextResponse.json({
        success: true,
        message: `成功批量创建了 ${questions.length} 道试题`,
        count: questions.length
      });
    }
    
    return NextResponse.json(
      { success: false, message: "无效的请求" },
      { status: 400 }
    );
  } catch (error) {
    console.error("批量创建试题失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "数据验证失败", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "批量创建试题失败" },
      { status: 500 }
    );
  }
} 