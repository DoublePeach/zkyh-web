/**
 * @description 测试基于数据库生成备考规划的脚本
 * @author 郝桃桃
 * @date 2024-08-05
 */

import { generateStudyPlanFromDatabase } from '../src/lib/ai/db-router.js';
import fs from 'fs';

// 测试用的表单数据
const testSurveyData = {
  titleLevel: 'junior', // 初级护师
  otherTitleLevel: '',
  examStatus: 'first', // 首次参加考试
  examYear: '2025',
  overallLevel: 'medium', // 有一定基础
  subjects: {
    basic: true,
    related: true,
    professional: true,
    practical: true
  },
  subjectLevels: {
    basic: 'medium',
    related: 'low',
    professional: 'medium',
    practical: 'low'
  },
  weekdaysCount: '3-4', // 每周3-4天
  weekdayHours: '1-2', // 工作日每天1-2小时
  weekendHours: '2-4' // 周末每天2-4小时
};

async function runTest() {
  console.log('开始测试基于数据库生成备考规划...');
  
  try {
    const startTime = Date.now();
    const result = await generateStudyPlanFromDatabase(testSurveyData);
    const endTime = Date.now();
    
    console.log(`生成成功！耗时: ${(endTime - startTime) / 1000}秒`);
    console.log('生成规划概览:', result.overview);
    console.log(`生成了 ${result.phases.length} 个学习阶段`);
    console.log(`生成了 ${result.dailyPlans.length} 天的学习计划`);
    
    // 检查是否包含数据库中的学科和章节
    const firstDayTasks = result.dailyPlans[0].tasks;
    console.log('第一天学习任务:', firstDayTasks.map(t => t.title).join(', '));
    
    // 保存结果到文件以便检查
    fs.writeFileSync('plan-result.json', JSON.stringify(result, null, 2));
    console.log('完整结果已保存到 plan-result.json');
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

runTest(); 