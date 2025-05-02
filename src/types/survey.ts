/**
 * @description 调查问卷相关类型定义
 * @author 郝桃桃
 * @date 2023-10-01
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