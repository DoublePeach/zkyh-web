/**
 * @description 用户反馈服务 - 提交反馈和获取反馈
 * @author 郝桃桃
 * @date 2024-05-10
 */

import { db } from '@/db';
import { feedbacks } from "@/db/schema/feedbacks";
import { eq, and, desc, sql } from 'drizzle-orm';

export interface FeedbackInput {
  userId: number;
  satisfaction: number;    // 1-10分
  suggestion?: string;     // 建议
  contactPhone?: string;   // 联系电话
  willContact: boolean;    // 是否愿意被联系
  source?: string;         // 反馈来源
}

/**
 * @description 提交用户反馈
 * @param feedback 反馈信息
 * @returns 创建的反馈ID
 */
export async function submitFeedback(feedback: FeedbackInput): Promise<number> {
  try {
    // 验证满意度分数
    if (feedback.satisfaction < 1 || feedback.satisfaction > 10) {
      throw new Error('满意度评分必须介于1-10分之间');
    }
    
    // 验证source参数是否为有效枚举值
    const validSources = ['study_plans', 'home', 'study_detail', 'profile'];
    const source = feedback.source && validSources.includes(feedback.source) 
      ? feedback.source 
      : 'study_plans';
    
    // 插入反馈记录
    const result = await db.insert(feedbacks).values({
      userId: feedback.userId,
      satisfaction: feedback.satisfaction,
      suggestion: feedback.suggestion || null,
      contactPhone: feedback.willContact ? (feedback.contactPhone || null) : null,
      willContact: feedback.willContact,
      source: source as any,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning({ id: feedbacks.id });
    
    // 返回创建的反馈ID
    return result[0].id;
  } catch (error) {
    console.error('提交用户反馈失败:', error);
    throw error;
  }
}

/**
 * @description 获取用户反馈列表（用于管理员）
 * @param page 页码
 * @param pageSize 每页条数
 * @param status 状态过滤
 * @returns 反馈列表及总数
 */
export async function getFeedbacks(page = 1, pageSize = 10, status?: string) {
  try {
    const offset = (page - 1) * pageSize;
    
    // 准备条件
    const conditions = [];
    if (status && ['pending', 'in_progress', 'completed', 'ignored'].includes(status)) {
      conditions.push(eq(feedbacks.status, status as any));
    }
    
    // 执行查询，获取分页数据
    const items = await db.select()
      .from(feedbacks)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(feedbacks.createdAt))
      .limit(pageSize)
      .offset(offset);
    
    // 获取总记录数
    const countResult = await db.select({
      count: sql`count(*)`.mapWith(Number)
    })
      .from(feedbacks)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const total = Number(countResult[0].count) || 0;
    
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error('获取用户反馈列表失败:', error);
    throw error;
  }
}

/**
 * @description 获取用户反馈详情
 * @param id 反馈ID
 * @returns 反馈详情
 */
export async function getFeedbackById(id: number) {
  try {
    const result = await db.select().from(feedbacks).where(eq(feedbacks.id, id));
    return result[0] || null;
  } catch (error) {
    console.error('获取用户反馈详情失败:', error);
    throw error;
  }
}

/**
 * @description 更新反馈状态和管理员备注
 * @param id 反馈ID
 * @param status 状态
 * @param adminNotes 管理员备注
 * @returns 是否成功
 */
export async function updateFeedbackStatus(id: number, status: string, adminNotes?: string) {
  try {
    // 验证状态参数是否为有效枚举值
    const validStatus = ['pending', 'in_progress', 'completed', 'ignored'];
    if (!validStatus.includes(status)) {
      throw new Error('无效的状态值');
    }
    
    // 更新反馈状态和备注
    await db.update(feedbacks)
      .set({ 
        status: status as any,
        adminNotes: adminNotes || feedbacks.adminNotes,
        updatedAt: new Date()
      })
      .where(eq(feedbacks.id, id));
    
    return true;
  } catch (error) {
    console.error('更新反馈状态失败:', error);
    throw error;
  }
} 