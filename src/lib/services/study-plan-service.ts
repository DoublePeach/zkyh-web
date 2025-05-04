/**
 * @description 备考规划服务
 * @author 郝桃桃
 * @date 2023-10-01
 */

import { db } from "@/db";
import { studyPlans } from "@/db/schema/studyPlans";
import { studyModules } from "@/db/schema/studyModules";
import { dailyTasks } from "@/db/schema/dailyTasks";
import { SurveyFormData, DailyTaskGenerated } from "@/types/survey";
import { generateStudyPlan } from "@/lib/ai/openrouter";
import { eq } from "drizzle-orm";
import { ApiResponse } from './api-service';
import type { InferSelectModel } from 'drizzle-orm';

type StudyPlan = InferSelectModel<typeof studyPlans>;
type StudyModule = InferSelectModel<typeof studyModules>;
type DailyTask = InferSelectModel<typeof dailyTasks>;

interface PlanDetailsData {
    plan: StudyPlan;
    modules: StudyModule[];
    tasks: DailyTask[]; 
}

/**
 * @description 创建用户的备考规划
 * @param {number|string} userId - 用户ID
 * @param {SurveyFormData} formData - 调查表单数据
 * @returns {Promise<number>} - 返回创建的备考规划ID
 */
export async function createStudyPlan(userId: number | string, formData: SurveyFormData): Promise<number> {
  try {
    // 确保userId是数字类型
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    // 1. 调用AI生成备考方案
    const planData = await generateStudyPlan(formData);
    
    // 2. 计算开始日期和结束日期
    const startDate = new Date();
    
    // 使用考试年份计算考试日期（默认每年4月13日）
    const examYear = parseInt(formData.examYear);
    const endDate = new Date(examYear, 3, 13); // 月份从0开始，所以4月是3
    
    // 3. 计算总天数
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // 4. 准备备考规划数据
    const planTitle = `护理职称(${formData.titleLevel === 'other' ? formData.otherTitleLevel : (formData.titleLevel === 'junior' ? '初级护师' : '主管护师')})备考规划`;
    
    // 5. 保存备考规划到数据库
    const [plan] = await db.insert(studyPlans).values({
      userId: userIdNum,
      title: planTitle,
      overview: planData.overview,
      profession: 'nursing', // 现在默认是护理类
      targetTitle: formData.titleLevel,
      totalDays: totalDays,
      startDate: startDate,
      endDate: endDate,
      isActive: true,
    }).returning({ id: studyPlans.id });
    
    // 6. 保存学习模块
    for (const studyModule of planData.modules) {
      const [moduleRecord] = await db.insert(studyModules).values({
        planId: plan.id,
        title: studyModule.title,
        description: studyModule.description,
        order: studyModule.order,
        durationDays: studyModule.durationDays,
        importance: studyModule.importance,
        difficulty: studyModule.difficulty,
      }).returning({ id: studyModules.id });
      
      // 7. 为这个模块保存每日任务
      const moduleTasks = planData.tasks.filter((task: DailyTaskGenerated) => task.moduleIndex === studyModule.order - 1);
      
      for (const task of moduleTasks) {
        await db.insert(dailyTasks).values({
          moduleId: moduleRecord.id,
          day: task.day,
          title: task.title,
          description: task.description,
          learningContent: task.learningContent,
          estimatedMinutes: task.estimatedMinutes,
          isCompleted: false,
        });
      }
    }
    
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
 * @returns {Promise<ApiResponse<PlanDetailsData>>}
 */
export async function getStudyPlanDetails(planId: number | string): Promise<ApiResponse<PlanDetailsData>> {
  try {
    const planIdNum = typeof planId === 'string' ? parseInt(planId, 10) : planId;
    
    // 1. 获取备考规划基本信息
    const plan = await db.select().from(studyPlans).where(eq(studyPlans.id, planIdNum)).limit(1);
    
    if (!plan || plan.length === 0) {
      return { success: false, error: '备考规划不存在' };
    }
    
    // 2. 获取所有学习模块
    const modules = await db.select()
      .from(studyModules)
      .where(eq(studyModules.planId, planIdNum))
      .orderBy(studyModules.order);
    
    // 3. 获取所有模块的每日任务
    const moduleIds = modules.map(m => m.id);
    
    const tasks = moduleIds.length > 0 
      ? await db.select().from(dailyTasks).where(
          eq(dailyTasks.moduleId, moduleIds[0])
        ).orderBy(dailyTasks.day)
      : [];
    
    return { success: true, data: { plan: plan[0], modules, tasks } };
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