/**
 * @description 测试备考规划服务
 * @author 郝桃桃
 * @date 2024-08-05
 */

import fs from 'fs';
import { createStudyPlan } from '../src/lib/services/study-plan-service.js';

// 模拟用户ID
const mockUserId = 123;

// 模拟调查问卷数据
const mockSurveyData = {
  profession: 'nursing',
  titleLevel: 'junior', // 初级护师
  examStatus: 'first', // 首次参加考试
  overallLevel: 'medium', // 有一定基础
  subjectLevels: {
    basic: 'medium',
    related: 'medium',
    professional: 'weak',
    practical: 'medium'
  },
  subjects: {
    basic: true,
    related: true,
    professional: true,
    practical: true
  },
  weekdaysCount: '3-4', // 每周3-4天
  weekdayHours: '1-2', // 工作日1-2小时
  weekendHours: '3-4', // 周末3-4小时
  examYear: '2025', // 考试年份
  otherTitleLevel: '' // 其他职称（不适用）
};

async function testStudyPlanService() {
  console.log('开始测试备考规划服务集成...');
  
  try {
    console.log('调用 createStudyPlan 函数...');
    console.log('用户ID:', mockUserId);
    console.log('调查问卷数据:', JSON.stringify(mockSurveyData, null, 2));
    
    const startTime = Date.now();
    
    const planId = await createStudyPlan(mockUserId, mockSurveyData);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`备考规划创建完成！ID: ${planId}, 耗时: ${duration.toFixed(2)}秒`);
    console.log('');
    
    // 由于该服务实际操作数据库，我们不尝试从数据库获取结果
    // 这里仅作为测试服务是否能正常工作
    console.log('测试成功完成。');
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 执行测试
testStudyPlanService(); 