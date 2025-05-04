/**
 * @description 知识点管理API
 * @author 郝桃桃
 * @date 2024-05-25
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { knowledgePoints, chapters, nursingDisciplines, examSubjects } from "@/db/schema/index";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// 请求验证Schema
const knowledgePointSchema = z.object({
  chapterId: z.number().int().positive("章节ID必须是正整数"),
  subjectId: z.number().int().positive("考试科目ID必须是正整数"),
  title: z.string().min(1, "知识点标题不能为空"),
  content: z.string().min(1, "知识点内容不能为空"),
  difficulty: z.number().int().min(1).max(5, "难度级别必须在1-5之间"),
  importance: z.number().int().min(1).max(5, "重要程度必须在1-5之间"),
  keywords: z.array(z.string()).optional(),
  tags: z.record(z.string(), z.any()).optional(),
});

// 获取所有知识点，可按学科、章节、科目过滤，支持关键词搜索
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const disciplineId = searchParams.get('disciplineId');
    const chapterId = searchParams.get('chapterId');
    const subjectId = searchParams.get('subjectId');
    const search = searchParams.get('search');
    
    let chapterIds: number[] = [];
    
    // 如果有学科ID，先获取该学科下的所有章节ID
    if (disciplineId) {
      const discId = parseInt(disciplineId);
      if (!isNaN(discId)) {
        const chaptersInDiscipline = await db
          .select({ id: chapters.id })
          .from(chapters)
          .where(eq(chapters.disciplineId, discId));
        
        chapterIds = chaptersInDiscipline.map(chapter => chapter.id);
        
        // 如果学科下没有章节，直接返回空数组
        if (chapterIds.length === 0) {
          return NextResponse.json({
            success: true,
            data: [],
          });
        }
      }
    }
    
    // 手动构建SQL查询
    const query = `
      SELECT 
        kp.id,
        kp.chapter_id AS "chapterId",
        c.name AS "chapterName",
        c.discipline_id AS "disciplineId",
        nd.name AS "disciplineName",
        kp.subject_id AS "subjectId",
        es.name AS "subjectName",
        kp.title,
        kp.content,
        kp.difficulty,
        kp.importance,
        kp.keywords,
        kp.tags,
        kp.created_at AS "createdAt",
        kp.updated_at AS "updatedAt"
      FROM 
        knowledge_points kp
      LEFT JOIN 
        chapters c ON kp.chapter_id = c.id
      LEFT JOIN 
        nursing_disciplines nd ON c.discipline_id = nd.id
      LEFT JOIN 
        exam_subjects es ON kp.subject_id = es.id
      WHERE 
        1=1
        ${disciplineId && chapterIds.length > 0 ? ` AND kp.chapter_id IN (${chapterIds.join(',')})` : ''}
        ${chapterId ? ` AND kp.chapter_id = ${parseInt(chapterId)}` : ''}
        ${subjectId ? ` AND kp.subject_id = ${parseInt(subjectId)}` : ''}
        ${search ? ` AND (kp.title LIKE '%${search}%' OR kp.content LIKE '%${search}%')` : ''}
      ORDER BY 
        kp.created_at DESC
    `;
    
    // 执行原始SQL查询
    const results = await db.execute(query);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("获取知识点失败:", error);
    return NextResponse.json(
      { success: false, message: "获取知识点失败", error: String(error) },
      { status: 500 }
    );
  }
}

// 创建新的知识点
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = knowledgePointSchema.parse(body);

    // 检查章节是否存在
    const chapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, validatedData.chapterId),
    });

    if (!chapter) {
      return NextResponse.json(
        { success: false, message: "所选章节不存在" },
        { status: 400 }
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

    // 检查标题是否在同一章节下已存在
    const existingTitle = await db.query.knowledgePoints.findFirst({
      where: and(
        eq(knowledgePoints.chapterId, validatedData.chapterId),
        eq(knowledgePoints.title, validatedData.title)
      ),
    });

    if (existingTitle) {
      return NextResponse.json(
        { success: false, message: "该章节下已存在同名知识点" },
        { status: 400 }
      );
    }

    // 插入新知识点
    const now = new Date();
    const result = await db.insert(knowledgePoints).values({
      ...validatedData,
      createdAt: now,
      updatedAt: now,
    }).returning();

    const newKnowledgePoint = result[0];

    // 获取章节和学科信息
    const chapterInfo = await db.select({
      chapterName: chapters.name,
      disciplineId: chapters.disciplineId,
      disciplineName: nursingDisciplines.name,
    })
    .from(chapters)
    .leftJoin(nursingDisciplines, eq(chapters.disciplineId, nursingDisciplines.id))
    .where(eq(chapters.id, newKnowledgePoint.chapterId))
    .execute();

    // 获取科目信息
    const subjectInfo = await db.select({
      subjectName: examSubjects.name,
    })
    .from(examSubjects)
    .where(eq(examSubjects.id, newKnowledgePoint.subjectId))
    .execute();

    return NextResponse.json({
      success: true,
      message: "知识点创建成功",
      data: {
        ...newKnowledgePoint,
        chapterName: chapterInfo[0]?.chapterName,
        disciplineId: chapterInfo[0]?.disciplineId,
        disciplineName: chapterInfo[0]?.disciplineName,
        subjectName: subjectInfo[0]?.subjectName,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("创建知识点失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "数据验证失败", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "创建知识点失败" },
      { status: 500 }
    );
  }
} 