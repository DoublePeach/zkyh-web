/**
 * @description 调查问卷相关类型定义
 * @author 郝桃桃
 * @date 2023-10-01
 */

/**
 * @description 调查表单数据类型
 */
export interface SurveyFormData {
  // 专业类别：医疗类/护理类/药技类
  profession: 'medical' | 'nursing' | 'pharmacy';
  
  // 当前职称：无/初级/中级
  currentTitle: 'none' | 'junior' | 'mid';
  
  // 目标职称：中级/副高/正高
  targetTitle: 'mid' | 'associate' | 'senior';
  
  // 每日学习时间：<1小时/1-2小时/2-4小时/4+小时
  studyTimePerDay: '<1' | '1-2' | '2-4' | '4+';
  
  // 计划考试日期
  examDate: string;
}

/**
 * @description AI生成的备考方案类型
 */
export interface StudyPlanGenerated {
  // 备考方案总览
  overview: string;
  
  // 学习模块列表
  modules: StudyModuleGenerated[];
  
  // 每日任务列表
  tasks: DailyTaskGenerated[];
}

/**
 * @description AI生成的学习模块类型
 */
export interface StudyModuleGenerated {
  title: string;
  description: string;
  importance: number; // 1-10
  difficulty: number; // 1-10
  durationDays: number;
  order: number;
}

/**
 * @description AI生成的每日任务类型
 */
export interface DailyTaskGenerated {
  moduleIndex: number; // 所属模块的索引
  day: number; // 第几天
  title: string;
  description: string;
  learningContent: string;
  estimatedMinutes: number;
} 