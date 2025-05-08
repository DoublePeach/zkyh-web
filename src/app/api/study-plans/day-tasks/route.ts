/**
 * @description 备考规划每日任务API - 获取特定日期的学习任务及相关知识点
 * @author 郝桃桃
 * @date 2024-08-20
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { knowledgePoints, examSubjects, chapters } from '@/db/schema';
import { eq, and, inArray, or, like, ilike } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    const date = searchParams.get('date');
    const day = searchParams.get('day');

    console.log(`知识点查询请求: planId=${planId}, date=${date}, day=${day}`);

    if (!planId) {
      return NextResponse.json(
        { success: false, message: '缺少备考规划ID参数' },
        { status: 400 }
      );
    }

    if (!date && !day) {
      return NextResponse.json(
        { success: false, message: '缺少日期参数或天数参数' },
        { status: 400 }
      );
    }

    // 1. 从本地存储中加载备考规划数据
    // 注意：这里假设客户端已经从 /api/study-plans/[id] 端点获取并缓存了备考规划
    // 所以这个API只负责获取特定日期对应的知识点，而不重复获取备考规划数据

    // 2. 获取相关知识点
    // 解析参数，获取该天学习的科目ID列表
    const subjects = searchParams.get('subjects')?.split(',');
    console.log(`请求的科目: ${subjects?.join(', ') || '无'}`);

    if (!subjects || subjects.length === 0) {
      console.log('没有科目参数，返回空知识点列表');
      return NextResponse.json({
        success: true,
        data: {
          dailyTask: null,
          knowledgePoints: [],
          relatedResources: []
        }
      });
    }

    // 默认优先查找专业实践能力相关的知识点
    const priorityKeywords = ['专业实践能力', '实践能力', '基础护理', '护理基础', '护理学'];
    
    let whereConditions = [];
    
    // 1. 先尝试通过科目名称精确匹配
    if (subjects.length > 0) {
      whereConditions.push(inArray(examSubjects.name, subjects));
    }
    
    // 2. 添加优先关键词模糊匹配条件
    const keywordConditions = priorityKeywords.map(keyword => 
      or(
        ilike(examSubjects.name, `%${keyword}%`),
        ilike(knowledgePoints.title, `%${keyword}%`),
        ilike(chapters.name, `%${keyword}%`)
      )
    );
    
    // 3. 添加章节和科目的模糊匹配条件 - 增加匹配几率
    const subjectMatchConditions = subjects.flatMap(subject => [
      ilike(examSubjects.name, `%${subject}%`),
      ilike(chapters.name, `%${subject}%`),
      ilike(knowledgePoints.title, `%${subject}%`)
    ]);
    
    if (keywordConditions.length > 0) {
      whereConditions.push(or(...keywordConditions));
    }
    
    if (subjectMatchConditions.length > 0) {
      whereConditions.push(or(...subjectMatchConditions));
    }
    
    // 4. 如果没有匹配条件，则返回基础护理学相关知识点
    if (whereConditions.length === 0) {
      console.log('没有匹配条件，使用默认查询条件');
      whereConditions.push(
        or(
          eq(chapters.disciplineId, 4), // 基础护理学ID为4
          eq(knowledgePoints.subjectId, 4) // 专业实践能力ID为4
        )
      );
    }
    
    // 构造最终查询条件 - 使用or连接各种条件
    const finalCondition = or(...whereConditions);

    console.log(`执行知识点查询，使用${whereConditions.length}个查询条件`);

    // 查询相关知识点
    const relevantKnowledgePoints = await db.select({
      id: knowledgePoints.id,
      title: knowledgePoints.title,
      content: knowledgePoints.content,
      subjectId: knowledgePoints.subjectId,
      subjectName: examSubjects.name,
      chapterId: knowledgePoints.chapterId,
      chapterName: chapters.name,
      difficulty: knowledgePoints.difficulty,
      importance: knowledgePoints.importance,
      keywords: knowledgePoints.keywords
    })
    .from(knowledgePoints)
    .leftJoin(examSubjects, eq(knowledgePoints.subjectId, examSubjects.id))
    .leftJoin(chapters, eq(knowledgePoints.chapterId, chapters.id))
    .where(finalCondition)
    .orderBy(knowledgePoints.importance)
    .limit(25); // 增加返回数量，确保有足够的知识点

    console.log(`查询到${relevantKnowledgePoints.length}个相关知识点`);
    
    // 如果没有找到知识点，尝试直接获取基础护理学的知识点
    if (relevantKnowledgePoints.length === 0) {
      console.log('未找到相关知识点，尝试获取基础护理学知识点');
      
      const fallbackPoints = await db.select({
        id: knowledgePoints.id,
        title: knowledgePoints.title,
        content: knowledgePoints.content,
        subjectId: knowledgePoints.subjectId,
        subjectName: examSubjects.name,
        chapterId: knowledgePoints.chapterId,
        chapterName: chapters.name,
        difficulty: knowledgePoints.difficulty,
        importance: knowledgePoints.importance,
        keywords: knowledgePoints.keywords
      })
      .from(knowledgePoints)
      .leftJoin(examSubjects, eq(knowledgePoints.subjectId, examSubjects.id))
      .leftJoin(chapters, eq(knowledgePoints.chapterId, chapters.id))
      .where(or(
        eq(chapters.disciplineId, 4), // 基础护理学
        eq(knowledgePoints.subjectId, 4)  // 专业实践能力
      ))
      .orderBy(knowledgePoints.importance)
      .limit(15); // 增加备选知识点数量
      
      console.log(`备选查询找到${fallbackPoints.length}个知识点`);
      
      // 使用备选知识点
      if (fallbackPoints.length > 0) {
        relevantKnowledgePoints.push(...fallbackPoints);
      }
    }
    
    // 最后确保：如果仍然没有找到知识点，再次尝试获取任何知识点
    if (relevantKnowledgePoints.length === 0) {
      console.log('仍未找到相关知识点，获取任何可用知识点');
      
      const lastResortPoints = await db.select({
        id: knowledgePoints.id,
        title: knowledgePoints.title,
        content: knowledgePoints.content,
        subjectId: knowledgePoints.subjectId,
        subjectName: examSubjects.name,
        chapterId: knowledgePoints.chapterId,
        chapterName: chapters.name,
        difficulty: knowledgePoints.difficulty,
        importance: knowledgePoints.importance,
        keywords: knowledgePoints.keywords
      })
      .from(knowledgePoints)
      .leftJoin(examSubjects, eq(knowledgePoints.subjectId, examSubjects.id))
      .leftJoin(chapters, eq(knowledgePoints.chapterId, chapters.id))
      .limit(10);
      
      console.log(`最终查询找到${lastResortPoints.length}个知识点`);
      relevantKnowledgePoints.push(...lastResortPoints);
    }

    // 返回数据
    return NextResponse.json({
      success: true,
      data: {
        dailyTask: null, // 前端从缓存中获取
        knowledgePoints: relevantKnowledgePoints,
        // 可以添加更多相关资源
        relatedResources: []
      }
    });
  } catch (error) {
    console.error('获取每日任务数据失败:', error);
    return NextResponse.json(
      { success: false, message: '获取数据失败', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 