/**
 * @description 备考规划服务
 * @author 郝桃桃
 * @date 2023-10-01
 */

import { db } from "@/db";
import { studyPlans } from "@/db/schema/studyPlans";
import { studyModules } from "@/db/schema/studyModules";
import { dailyTasks } from "@/db/schema/dailyTasks";
import { SurveyFormData } from "@/types/survey";
import { generateStudyPlan } from "@/lib/ai/openrouter";
import { eq, inArray } from "drizzle-orm";
import { ApiResponse } from './api-service';
import type { InferSelectModel } from 'drizzle-orm';

type StudyPlan = InferSelectModel<typeof studyPlans>;
// 虽然StudyModule暂时未使用，但在级联删除功能中是必要的
// type StudyModule = InferSelectModel<typeof studyModules>;
type DailyTask = InferSelectModel<typeof dailyTasks>;

/**
 * @description 创建用户的备考规划
 * @param {number|string} userId - 用户ID
 * @param {SurveyFormData} formData - 调查表单数据
 * @returns {Promise<number>} - 返回创建的备考规划ID
 */
export async function createStudyPlan(userId: number | string, formData: SurveyFormData): Promise<number> {
  try {
    console.log('开始创建备考规划...');
    
    // 确保userId是数字类型
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    // 1. 调用AI生成备考方案
    console.log('正在调用AI生成备考方案...');
    const planData = await generateStudyPlan(formData);
    console.log('AI成功生成备考方案');
    
    // 2. 计算开始日期和结束日期
    const startDate = new Date();
    
    // 使用考试年份计算考试日期（默认每年4月13日）
    const examYear = parseInt(formData.examYear);
    const endDate = new Date(examYear, 3, 13); // 月份从0开始，所以4月是3
    
    // 3. 计算总天数
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // 4. 准备备考规划数据
    const planTitle = `护理职称(${formData.titleLevel === 'other' ? formData.otherTitleLevel : (formData.titleLevel === 'junior' ? '初级护师' : '主管护师')})备考规划`;
    
    console.log(`准备保存备考规划数据: ${planTitle}, 总天数: ${totalDays}天`);
    
    // 5. 保存备考规划到数据库
    const [plan] = await db.insert(studyPlans).values({
      userId: userIdNum,
      title: planTitle,
      startDate: startDate,
      endDate: endDate,
      totalDays: totalDays,
      examYear: examYear,
      // 存储完整的规划数据为JSON
      planData: planData,
      isActive: true
    }).returning({ id: studyPlans.id });
    
    console.log(`备考规划成功创建，ID: ${plan.id}`);
    return plan.id;
  } catch (error) {
    console.error('创建备考规划失败:', error);
    throw error;
  }
}

/**
 * @description 获取用户的备考规划列表
 * @param {number|string} userId - 用户ID
 * @returns {Promise<ApiResponse<StudyPlan[]>>}
 */
export async function getUserStudyPlans(userId: number | string): Promise<ApiResponse<StudyPlan[]>> {
  try {
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const data = await db.select()
      .from(studyPlans)
      .where(eq(studyPlans.userId, userIdNum))
      .orderBy(studyPlans.createdAt);
    return { success: true, data };
  } catch (error: unknown) {
    console.error('获取备考规划列表失败:', error);
    return { success: false, error: error instanceof Error ? error.message : "未知错误" };
  }
}

/**
 * @description 获取备考规划的详细信息
 * @param {number|string} planId - 备考规划ID
 * @returns {Promise<ApiResponse<any>>}
 */
export async function getStudyPlanDetails(planId: number | string): Promise<ApiResponse<{
  plan: StudyPlan;
  phases: Record<string, unknown>[];
  dailyPlans: Record<string, unknown>[];
}>> {
  try {
    const planIdNum = typeof planId === 'string' ? parseInt(planId, 10) : planId;
    
    // 获取备考规划基本信息
    const plan = await db.select().from(studyPlans).where(eq(studyPlans.id, planIdNum)).limit(1);
    
    if (!plan || plan.length === 0) {
      return { success: false, error: '备考规划不存在' };
    }
    
    // 返回完整的规划数据，包括基本信息和详细规划
    const planDetails = plan[0];
    
    // 为了向后兼容，如果没有planData，则返回空数组
    const planData = planDetails.planData as Record<string, unknown> || {};
    const phases = (planData.phases as Record<string, unknown>[]) || [];
    const dailyPlans = (planData.dailyPlans as Record<string, unknown>[]) || [];
    
    return { 
      success: true, 
      data: { 
        plan: planDetails,
        phases,
        dailyPlans,
      }
    };
  } catch (error: unknown) {
    console.error('获取备考规划详情失败:', error);
    return { success: false, error: error instanceof Error ? error.message : "未知错误" };
  }
}

/**
 * @description 获取模块的每日任务
 * @param {number|string} moduleId - 模块ID
 * @returns {Promise<ApiResponse<DailyTask[]>>}
 */
export async function getModuleTasks(moduleId: number | string): Promise<ApiResponse<DailyTask[]>> {
  try {
    const moduleIdNum = typeof moduleId === 'string' ? parseInt(moduleId, 10) : moduleId;
    const data = await db.select()
      .from(dailyTasks)
      .where(eq(dailyTasks.moduleId, moduleIdNum))
      .orderBy(dailyTasks.day);
     return { success: true, data };
  } catch (error: unknown) {
    console.error('获取模块任务失败:', error);
    return { success: false, error: error instanceof Error ? error.message : "未知错误" };
  }
}

// Comment out unused helper functions if they are truly not needed elsewhere
/**
 * @description 获取专业名称
 * @param {string} profession - 专业代码
 * @returns {string} - 专业名称
 */
// function getProfessionName(profession: string): string {
//   const map: Record<string, string> = {
//     'medical': '医疗类',
//     'nursing': '护理类',
//     'pharmacy': '药技类'
//   };
//   return map[profession] || '未知专业';
// }

/**
 * @description 获取职称名称
 * @param {string} title - 职称代码
 * @returns {string} - 职称名称
 */
// function getTitleName(title: string): string {
//   const map: Record<string, string> = {
//     'none': '无职称',
//     'junior': '初级职称',
//     'mid': '中级职称',
//     'associate': '副高级',
//     'senior': '正高级'
//   };
//   return map[title] || '未知职称';
// }

/**
 * @description 删除备考规划
 * @param {number|string} planId - 备考规划ID
 * @returns {Promise<ApiResponse<boolean>>} - 删除操作结果
 */
export async function deleteStudyPlan(planId: number | string): Promise<ApiResponse<boolean>> {
  try {
    console.log('开始删除备考规划，ID:', planId);
    const planIdNum = typeof planId === 'string' ? parseInt(planId, 10) : planId;
    
    // 先检查规划是否存在
    const existingPlan = await db.select({ id: studyPlans.id })
      .from(studyPlans)
      .where(eq(studyPlans.id, planIdNum))
      .limit(1);
      
    if (!existingPlan || existingPlan.length === 0) {
      return { success: false, error: '备考规划不存在' };
    }
    
    // 使用事务进行级联删除
    return await db.transaction(async (tx) => {
      try {
        // 1. 先查询关联的模块IDs
        const modules = await tx.select({ id: studyModules.id })
          .from(studyModules)
          .where(eq(studyModules.planId, planIdNum));
        
        const moduleIds = modules.map(m => m.id);
        
        // 2. 如果有关联模块，删除它们的每日任务
        if (moduleIds.length > 0) {
          await tx.delete(dailyTasks)
            .where(inArray(dailyTasks.moduleId, moduleIds));
          console.log(`已删除规划(ID: ${planId})关联模块的每日任务`);
        }
        
        // 3. 删除学习模块
        await tx.delete(studyModules)
          .where(eq(studyModules.planId, planIdNum));
        console.log(`已删除规划(ID: ${planId})的关联学习模块`);
        
        // 4. 最后删除备考规划本身
        await tx.delete(studyPlans)
          .where(eq(studyPlans.id, planIdNum));
        
        console.log('备考规划删除成功，ID:', planId);
        return { success: true, data: true };
      } catch (error) {
        console.error('事务内删除操作失败:', error);
        throw error; // 抛出错误使事务回滚
      }
    });
  } catch (error: unknown) {
    console.error('删除备考规划失败:', error);
    return { success: false, error: error instanceof Error ? error.message : "未知错误" };
  }
} 