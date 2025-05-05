/**
 * @description 客户端数据库服务 - 通过API调用获取数据
 * @author 郝桃桃
 * @date 2023-10-02
 */

import { SurveyFormData } from "@/types/survey";
import type { studyPlans, studyModules, dailyTasks } from '@/db/schema'; 
import type { InferSelectModel } from 'drizzle-orm'; 

type StudyPlan = InferSelectModel<typeof studyPlans>;
type StudyModule = InferSelectModel<typeof studyModules>;
type DailyTask = InferSelectModel<typeof dailyTasks>;

interface PlanDetailsData {
    plan: StudyPlan;
    modules: StudyModule[];
    tasks: DailyTask[]; 
}

const API_BASE_URL = '/api';

/**
 * @description 创建用户的备考规划
 * @param {number|string} userId - 用户ID
 * @param {SurveyFormData} formData - 调查表单数据
 * @returns {Promise<number>} - 返回创建的备考规划ID
 */
export async function createStudyPlan(userId: number | string, formData: SurveyFormData): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/study-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, formData }),
    });
    
    if (!response.ok) {
      throw new Error(`创建备考规划失败: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.planId;
  } catch (error) {
    console.error('创建备考规划失败:', error);
    throw error;
  }
}

/**
 * @description 获取用户的备考规划列表
 * @param {number|string} userId - 用户ID
 * @returns {Promise<StudyPlan[]>} - 返回备考规划列表
 */
export async function getUserStudyPlans(userId: number | string): Promise<StudyPlan[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/study-plans`);
    
    if (!response.ok) {
      throw new Error(`获取备考规划列表失败: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.plans || [];
  } catch (error) {
    console.error('获取备考规划列表失败:', error);
    throw error;
  }
}

/**
 * @description 获取备考规划的详细信息
 * @param {number|string} planId - 备考规划ID
 * @returns {Promise<PlanDetailsData>} - 返回备考规划详情
 */
export async function getStudyPlanDetails(planId: number | string): Promise<PlanDetailsData> {
  try {
    const response = await fetch(`${API_BASE_URL}/study-plans/${planId}`);
    
    if (!response.ok) {
      throw new Error(`获取备考规划详情失败: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data || !data.success || !data.data) {
        throw new Error(data.error || '获取备考规划详情失败: 无效的API响应');
    }
    return data.data;
  } catch (error) {
    console.error('获取备考规划详情失败:', error);
    throw error;
  }
}

/**
 * @description 获取模块的每日任务
 * @param {number|string} moduleId - 模块ID
 * @returns {Promise<DailyTask[]>} - 返回模块的每日任务
 */
export async function getModuleTasks(moduleId: number | string): Promise<DailyTask[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/modules/${moduleId}/tasks`);
    
    if (!response.ok) {
      throw new Error(`获取模块任务失败: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.tasks || [];
  } catch (error) {
    console.error('获取模块任务失败:', error);
    throw error;
  }
}

/**
 * @description 删除备考规划
 * @param {number|string} planId - 备考规划ID
 * @returns {Promise<boolean>} - 返回删除操作是否成功
 */
export async function deleteStudyPlan(planId: number | string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/study-plans/${planId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `删除备考规划失败: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('删除备考规划失败:', error);
    throw error;
  }
} 