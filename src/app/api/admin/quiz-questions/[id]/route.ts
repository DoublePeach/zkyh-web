/**
 * @description 单个试题管理API
 * @author 郝桃桃
 * @date 2024-05-26
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quizQuestions, testBanks, knowledgePoints } from "@/db/schema";
import { eq } from "drizzle-orm";
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

// 获取单个试题
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const questionId = parseInt(id);
    
    if (isNaN(questionId)) {
      return NextResponse.json(
        { success: false, message: "无效的ID" },
        { status: 400 }
      );
    }

    // 使用SQL字符串查询获取试题及关联信息
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
        qq.id = ${questionId}
    `;
    
    const result = await db.execute(query);

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: "试题不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("获取试题失败:", error);
    return NextResponse.json(
      { success: false, message: "获取试题失败" },
      { status: 500 }
    );
  }
}

// 更新试题
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const questionId = parseInt(id);
    
    if (isNaN(questionId)) {
      return NextResponse.json(
        { success: false, message: "无效的ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = quizQuestionSchema.parse(body);

    // 检查试题是否存在
    const existingQuestion = await db.query.quizQuestions.findFirst({
      where: eq(quizQuestions.id, questionId),
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { success: false, message: "试题不存在" },
        { status: 404 }
      );
    }

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

    // 更新试题
    await db.update(quizQuestions)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(quizQuestions.id, questionId));

    // 如果更改了题库，更新旧题库和新题库的题目数量
    if (existingQuestion.testBankId !== validatedData.testBankId) {
      // 更新旧题库的题目数量
      await db.execute(
        `UPDATE test_banks 
         SET total_questions = (
           SELECT COUNT(*) FROM quiz_questions 
           WHERE test_bank_id = ${existingQuestion.testBankId}
         ) 
         WHERE id = ${existingQuestion.testBankId}`
      );
      
      // 更新新题库的题目数量
      await db.execute(
        `UPDATE test_banks 
         SET total_questions = (
           SELECT COUNT(*) FROM quiz_questions 
           WHERE test_bank_id = ${validatedData.testBankId}
         ) 
         WHERE id = ${validatedData.testBankId}`
      );
    }

    // 获取更新后的试题信息
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
        qq.id = ${questionId}
    `;
    
    const result = await db.execute(query);

    return NextResponse.json({
      success: true,
      message: "试题更新成功",
      data: result[0],
    });
  } catch (error) {
    console.error("更新试题失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "数据验证失败", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "更新试题失败" },
      { status: 500 }
    );
  }
}

// 删除试题
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const questionId = parseInt(id);
    
    if (isNaN(questionId)) {
      return NextResponse.json(
        { success: false, message: "无效的ID" },
        { status: 400 }
      );
    }

    // 检查试题是否存在
    const question = await db.query.quizQuestions.findFirst({
      where: eq(quizQuestions.id, questionId),
    });

    if (!question) {
      return NextResponse.json(
        { success: false, message: "试题不存在" },
        { status: 404 }
      );
    }

    // 保存题库ID以便后续更新
    const testBankId = question.testBankId;

    // 删除试题
    await db.delete(quizQuestions).where(eq(quizQuestions.id, questionId));

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
      message: "试题删除成功",
    });
  } catch (error) {
    console.error("删除试题失败:", error);
    return NextResponse.json(
      { success: false, message: "删除试题失败" },
      { status: 500 }
    );
  }
} 