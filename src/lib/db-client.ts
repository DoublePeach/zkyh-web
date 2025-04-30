/**
 * @description 客户端数据库服务 - 通过API调用获取数据
 * @author 郝桃桃
 * @date 2023-10-02
 */

import { SurveyFormData } from "@/types/survey";

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
 * @returns {Promise<any[]>} - 返回备考规划列表
 */
export async function getUserStudyPlans(userId: number | string): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/study-plans`);
    
    if (!response.ok) {
      throw new Error(`获取备考规划列表失败: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.plans;
  } catch (error) {
    console.error('获取备考规划列表失败:', error);
    throw error;
  }
}

/**
 * @description 获取备考规划的详细信息
 * @param {number|string} planId - 备考规划ID
 * @returns {Promise<any>} - 返回备考规划详情
 */
export async function getStudyPlanDetails(planId: number | string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/study-plans/${planId}`);
    
    if (!response.ok) {
      throw new Error(`获取备考规划详情失败: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('获取备考规划详情失败:', error);
    throw error;
  }
}

/**
 * @description 获取模块的每日任务
 * @param {number|string} moduleId - 模块ID
 * @returns {Promise<any[]>} - 返回模块的每日任务
 */
export async function getModuleTasks(moduleId: number | string): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/modules/${moduleId}/tasks`);
    
    if (!response.ok) {
      throw new Error(`获取模块任务失败: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.tasks;
  } catch (error) {
    console.error('获取模块任务失败:', error);
    throw error;
  }
} 