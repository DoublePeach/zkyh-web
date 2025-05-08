/**
 * @description AI模块统一导出入口
 * @author 郝桃桃
 * @date 2024-09-29
 */

// 导出主要服务接口
export {
  generateStudyPlanFromDatabase,
  generateBasicStudyPlan
} from './study-plan-service';

// 导出公共API类型
export type { AIResponseData } from './api-client';

// 导出提示词生成函数（如果其他地方需要直接使用）
export {
  generateBasicPrompt,
  generateDatabasePrompt
} from './templates/study-plan-prompt';

// 导出公共API函数（如果需要直接调用）
export { callAIAPI } from './api-client';

// 重新导出备选方案生成器
export { generateLocalStudyPlan } from './fallback-generator';