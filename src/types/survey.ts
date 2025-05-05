/**
 * @description 调查问卷相关类型定义
 * @author 郝桃桃
 * @date 2023-10-01
 */

/**
 * @description 备考问卷表单数据类型
 * @author 郝桃桃
 * @date 2024-05-30
 */

/**
 * @description 调查表单数据类型
 */
export interface SurveyFormData {
  // 考试基本信息
  titleLevel: 'junior' | 'mid' | 'other'; // 初级护师、主管护师、其他
  otherTitleLevel: string; // 若选择"其他"则填写
  examStatus: 'first' | 'partial'; // 首次参加考试、已通过部分科目
  examYear: string; // 考试年份
  
  // 考试科目选择（若已通过部分科目才需填写）
  subjects: {
    basic: boolean; // 基础知识
    related: boolean; // 相关专业知识
    professional: boolean; // 专业知识
    practical: boolean; // 实践能力
  };
  
  // 学习基础评估
  overallLevel: 'weak' | 'medium' | 'strong'; // 基础薄弱、有一定基础、基础扎实
  subjectLevels: {
    basic: 'low' | 'medium' | 'high'; // 基础知识水平
    related: 'low' | 'medium' | 'high'; // 相关专业知识水平
    professional: 'low' | 'medium' | 'high'; // 专业知识水平
    practical: 'low' | 'medium' | 'high'; // 实践能力水平
  };
  
  // 学习时间安排
  weekdaysCount: '1-2' | '3-4' | '5'; // 每周学习天数
  weekdayHours: '<1' | '1-2' | '2-3' | '3+'; // 工作日每天学习小时数
  weekendHours: '<2' | '2-4' | '4-6' | '6+'; // 周末每天学习小时数
}

/**
 * @description AI生成的备考方案类型
 */
export interface StudyPlanGenerated {
  // 备考方案总览
  overview: string;
  
  // 学习阶段
  phases: PhaseGenerated[];
  
  // 每日任务
  dailyPlans: DailyPlanGenerated[];
}

/**
 * @description AI生成的学习阶段类型
 */
export interface PhaseGenerated {
  id: number;
  name: string;
  description: string;
  startDay: number;
  endDay: number;
  focusAreas: string[];
  learningGoals: string[];
  recommendedResources: string[];
}

/**
 * @description AI生成的每日学习计划类型
 */
export interface DailyPlanGenerated {
  day: number;
  date: string;
  phaseId: number;
  title: string;
  subjects: string[];
  tasks: TaskGenerated[];
  reviewTips: string;
}

/**
 * @description AI生成的学习任务类型
 */
export interface TaskGenerated {
  title: string;
  description: string;
  duration: number;
  resources: string[];
} 