/**
 * @description 备考规划每日任务API - 获取特定日期的学习任务及相关知识点
 * @author 郝桃桃
 * @date 2024-08-20
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { knowledgePoints, examSubjects, chapters } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    const date = searchParams.get('date');
    const day = searchParams.get('day');

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
    if (!subjects || subjects.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          dailyTask: null,
          knowledgePoints: [],
          relatedResources: []
        }
      });
    }

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
    .where(
      and(
        // 仅获取与当天学习科目相关的知识点
        inArray(
          examSubjects.name, 
          subjects
        ),
        // 可以添加更多的条件，例如按难度、重要性等筛选
        // 这里简化处理，获取所有相关科目的知识点
      )
    )
    .limit(20); // 限制返回数量，防止数据过大

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