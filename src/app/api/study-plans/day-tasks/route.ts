/**
 * @description 备考规划每日任务API - 获取特定日期的学习任务及相关知识点
 * @author 郝桃桃
 * @date 2024-08-20
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { knowledgePoints, examSubjects, chapters } from '@/db/schema';
import { eq, inArray, or, ilike, and, not, sql, asc, desc, like } from 'drizzle-orm';

// 每天分配的知识点数量
const POINTS_PER_DAY = 15;

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

    // 计算当前是第几天
    let dayNumber = 1;
    if (day) {
      dayNumber = parseInt(day, 10);
    } else if (date) {
      // 将日期转换为从计划开始的天数
      // 这里仅使用月份和日期的组合作为简单计算
      const dateObj = new Date(date);
      // 使用5月1日作为起点，计算天数差异
      dayNumber = dateObj.getDate() - 1 + (dateObj.getMonth() - 4) * 30;
      if (dayNumber < 1) dayNumber = 1;
    }

    console.log(`计算得到的天数: ${dayNumber}`);

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
    
    const whereConditions = [];
    
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
    
    // 构造基础查询条件 - 使用or连接各种条件
    const baseCondition = or(...whereConditions);

    console.log(`执行知识点查询，使用${whereConditions.length}个查询条件`);

    // 首先获取所有匹配条件的知识点总数，用于分页计算
    const countResult = await db.select({
      count: sql`count(*)`
    })
    .from(knowledgePoints)
    .leftJoin(examSubjects, eq(knowledgePoints.subjectId, examSubjects.id))
    .leftJoin(chapters, eq(knowledgePoints.chapterId, chapters.id))
    .where(baseCondition);
    
    const totalPoints = Number(countResult[0]?.count || 0);
    console.log(`符合条件的知识点总数: ${totalPoints}`);

    // 根据总知识点数和每天分配的数量，计算偏移量
    // 使用循环分配：当学习完所有知识点后，从头开始
    const offset = ((dayNumber - 1) * POINTS_PER_DAY) % Math.max(totalPoints, 1);
    console.log(`计算得到的偏移量: ${offset}`);

    // 查询相关知识点，使用偏移量获取连续的知识点
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
    .where(baseCondition)
    .orderBy(knowledgePoints.title) // 按知识点标题排序，通常标题包含章节编号
    .limit(POINTS_PER_DAY)
    .offset(offset);

    console.log(`查询到${relevantKnowledgePoints.length}个相关知识点`);
    
    // 如果使用偏移量获取的知识点不足，需要从头补充
    if (relevantKnowledgePoints.length < POINTS_PER_DAY && totalPoints > POINTS_PER_DAY) {
      console.log('知识点不足，从头补充');
      
      const remainingCount = POINTS_PER_DAY - relevantKnowledgePoints.length;
      const additionalPoints = await db.select({
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
      .where(baseCondition)
      .orderBy(knowledgePoints.title)
      .limit(remainingCount)
      .offset(0);
      
      console.log(`补充查询到${additionalPoints.length}个知识点`);
      relevantKnowledgePoints.push(...additionalPoints);
    }
    
    // 如果仍然没有找到知识点，尝试直接获取基础护理学的知识点
    if (relevantKnowledgePoints.length === 0) {
      console.log('未找到相关知识点，尝试获取基础护理学知识点');
      
      const fallbackCondition = or(
        eq(chapters.disciplineId, 4), // 基础护理学
        eq(knowledgePoints.subjectId, 4)  // 专业实践能力
      );
      
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
      .where(fallbackCondition)
      .orderBy(knowledgePoints.title)
      .limit(POINTS_PER_DAY);
      
      console.log(`备选查询找到${fallbackPoints.length}个知识点`);
      relevantKnowledgePoints.push(...fallbackPoints);
    }
    
    // 最后确保：如果仍然没有找到知识点，获取任何知识点
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
      .orderBy(knowledgePoints.title)
      .limit(POINTS_PER_DAY);
      
      console.log(`最终查询找到${lastResortPoints.length}个知识点`);
      relevantKnowledgePoints.push(...lastResortPoints);
    }

    // 对最终结果按知识点标题排序，确保学习顺序正确
    const sortedPoints = relevantKnowledgePoints.sort((a, b) => {
      // 解析标题中的章节编号（如1.1.1, 5.1.3等）
      const getNumberPrefix = (title: string) => {
        const match = title.match(/^(\d+(\.\d+)*)/);
        return match ? match[0] : '';
      };
      
      const prefixA = getNumberPrefix(a.title);
      const prefixB = getNumberPrefix(b.title);
      
      if (prefixA && prefixB) {
        // 如果两者都有编号，按编号排序
        const partsA = prefixA.split('.').map(Number);
        const partsB = prefixB.split('.').map(Number);
        
        // 比较每一位数字
        for (let i = 0; i < Math.min(partsA.length, partsB.length); i++) {
          if (partsA[i] !== partsB[i]) {
            return partsA[i] - partsB[i];
          }
        }
        
        // 如果前面的数字都相同，长度较短的编号排在前面
        return partsA.length - partsB.length;
      }
      
      // 如果只有一个有编号，有编号的排在前面
      if (prefixA) return -1;
      if (prefixB) return 1;
      
      // 如果都没有编号，按标题字母顺序排序
      return a.title.localeCompare(b.title);
    });

    // 返回数据
    return NextResponse.json({
      success: true,
      data: {
        dailyTask: null, // 前端从缓存中获取
        knowledgePoints: sortedPoints,
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