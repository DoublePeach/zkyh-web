/**
 * @description 备考规划提示词模板
 * @author 郝桃桃
 * @date 2024-09-29
 */

import { SurveyFormData } from '@/types/survey';

/**
 * @description 获取学习基础水平描述
 * @param {string} level - 水平值
 * @returns {string} 水平描述
 */
export function getLevelDescription(level: string): string {
  const levelMap: Record<string, string> = {
    'low': '了解较少（★）',
    'medium': '一般了解（★★）',
    'strong': '基础扎实（★★★）',
    'weak': '基础薄弱，需要从头开始'
  };
  return levelMap[level] || '未知水平';
}

/**
 * @description 获取工作日学习天数描述
 * @param {string} count - 天数值
 * @returns {string} 天数描述
 */
export function getWeekdaysCountDescription(count: string): string {
  const countMap: Record<string, string> = {
    '1-2': '每周1-2天',
    '3-4': '每周3-4天',
    '5': '每周5天'
  };
  return countMap[count] || '未知天数';
}

/**
 * @description 获取学习时长描述
 * @param {string} hours - 小时值
 * @param {string} dayType - 日期类型
 * @returns {string} 时长描述
 */
export function getHoursDescription(hours: string, dayType: string): string {
  if (dayType === '工作日') {
    const hoursMap: Record<string, string> = {
      '<1': '工作日每天学习不到1小时',
      '1-2': '工作日每天学习1-2小时',
      '2-3': '工作日每天学习2-3小时',
      '3+': '工作日每天学习3小时以上'
    };
    return hoursMap[hours] || `${dayType}未知时长`;
  } else {
    const hoursMap: Record<string, string> = {
      '<2': '周末每天学习不到2小时',
      '2-4': '周末每天学习2-4小时',
      '4-6': '周末每天学习4-6小时',
      '6+': '周末每天学习6小时以上'
    };
    return hoursMap[hours] || `${dayType}未知时长`;
  }
}

/**
 * @description 生成学习基础描述文本
 * @param {SurveyFormData} surveyData - 用户调查问卷数据
 * @returns {string} 学习基础描述
 */
export function generateStudyBaseDescription(surveyData: SurveyFormData): string {
  let studyBaseDescription = '';
  
  if(surveyData.examStatus === 'first') {
    studyBaseDescription = surveyData.overallLevel === 'weak' ? '基础薄弱，需要从头开始' :
                         surveyData.overallLevel === 'medium' ? '有一定基础，部分内容需要加强' :
                         '基础扎实，需要系统复习';
  } else {
    // 对于已通过部分科目的情况，列出需要考试的科目及基础水平
    studyBaseDescription = '已选科目基础情况：\n';
    if(surveyData.subjects.basic) {
      studyBaseDescription += `- 基础知识：${getLevelDescription(surveyData.subjectLevels.basic)}\n`;
    }
    if(surveyData.subjects.related) {
      studyBaseDescription += `- 相关专业知识：${getLevelDescription(surveyData.subjectLevels.related)}\n`;
    }
    if(surveyData.subjects.professional) {
      studyBaseDescription += `- 专业知识：${getLevelDescription(surveyData.subjectLevels.professional)}\n`;
    }
    if(surveyData.subjects.practical) {
      studyBaseDescription += `- 实践能力：${getLevelDescription(surveyData.subjectLevels.practical)}\n`;
    }
  }
  
  return studyBaseDescription;
}

/**
 * @description 生成基础版备考规划提示词
 * @param {SurveyFormData} surveyData - 调查问卷数据
 * @param {number} daysUntilExam - 距离考试天数
 * @param {Date} examDate - 考试日期
 * @returns {string} 生成的提示词
 */
export function generateBasicPrompt(
  surveyData: SurveyFormData, 
  daysUntilExam: number, 
  examDate: Date
): string {
  // 获取职称级别
  const titleLevel = surveyData.titleLevel === 'junior' ? '初级护师' : 
                    surveyData.titleLevel === 'mid' ? '主管护师' : 
                    surveyData.otherTitleLevel;
  
  // 获取相关中文描述
  const examStatus = surveyData.examStatus === 'first' ? '首次参加考试' : '已通过部分科目';
  
  // 学习基础描述
  const studyBaseDescription = generateStudyBaseDescription(surveyData);
  
  // 学习时间描述
  const weekdaysCountDesc = getWeekdaysCountDescription(surveyData.weekdaysCount);
  const weekdayHoursDesc = getHoursDescription(surveyData.weekdayHours, '工作日');
  const weekendHoursDesc = getHoursDescription(surveyData.weekendHours, '周末');
  
  // 构建提示词
  return `你是一位专业的医卫职称备考规划专家，擅长为医疗从业人员制定个性化的备考计划。
请根据以下用户信息生成一个详细的备考规划，包括三个学习阶段和每日任务安排。

用户信息:
- 报考职称: ${titleLevel}
- 考试状态: ${examStatus}
- 学习基础: ${studyBaseDescription}
- 学习时间安排: 
  * 每周工作日学习: ${weekdaysCountDesc}
  * ${weekdayHoursDesc}
  * ${weekendHoursDesc}
- 距离考试还有${daysUntilExam}天，考试日期: ${examDate.toLocaleDateString('zh-CN')}

请返回一个JSON对象，包含以下内容(字段名称保持英文，内容使用中文):

{
  "overview": "整体备考规划总览，一段文字描述整体备考思路和关键建议",
  "phases": [
    {
      "id": 1,
      "name": "基础学习阶段",
      "description": "阶段描述",
      "startDay": 1,
      "endDay": X, // 具体天数
      "focusAreas": ["重点1", "重点2", "..."],
      "learningGoals": ["目标1", "目标2", "..."],
      "recommendedResources": ["资源1", "资源2", "..."]
    },
    {
      "id": 2,
      "name": "重点强化阶段",
      "description": "阶段描述",
      "startDay": X+1,
      "endDay": Y, // 具体天数
      "focusAreas": ["重点1", "重点2", "..."],
      "learningGoals": ["目标1", "目标2", "..."],
      "recommendedResources": ["资源1", "资源2", "..."]
    },
    {
      "id": 3,
      "name": "模拟冲刺阶段",
      "description": "阶段描述",
      "startDay": Y+1,
      "endDay": ${daysUntilExam}, // 到考试前一天
      "focusAreas": ["重点1", "重点2", "..."],
      "learningGoals": ["目标1", "目标2", "..."],
      "recommendedResources": ["资源1", "资源2", "..."]
    }
  ],
  "dailyPlans": [
    {
      "day": 1,
      "date": "YYYY-MM-DD", // 使用具体日期
      "phaseId": 1, // 对应上面phases中的id
      "title": "第1天学习计划标题",
      "subjects": ["学习科目1", "学习科目2", "..."],
      "tasks": [
        {
          "title": "任务1标题",
          "description": "任务1描述",
          "duration": 60, // 预计时长（分钟）
          "resources": ["资源链接或描述1", "资源链接或描述2"]
        },
        // 更多任务...
      ],
      "reviewTips": "当天复习建议"
    },
    // 每天一条记录，直到考试前一天 (day: ${daysUntilExam})
  ]
}

请根据用户的职称等级、考试状态、学习基础和可用学习时间自定义规划。确保：
1. 三个阶段时长按照备考时间合理分配（基础:强化:冲刺 大致为 4:3:3 或根据学习基础调整）
2. 每日计划要考虑用户可用的学习时间，工作日和周末分配不同的学习量
3. 每个任务的时长应该合理且加起来不超过用户当天可用的学习时间
4. 学习资源要具体且有实用性，例如《xxx教材第n章》、"护理技能操作视频"等

请确保返回的JSON格式正确，便于系统解析。请不要在JSON前后添加任何额外的说明或描述。`;
}

/**
 * @description 生成带有数据库学习资料的高级提示词
 * @param {SurveyFormData} surveyData - 调查问卷数据
 * @param {number} daysUntilExam - 距离考试天数
 * @param {Date} examDate - 考试日期
 * @param {boolean} isLongTermPlan - 是否长期规划
 * @param {number} planGenerationDays - 规划生成天数
 * @param {any} learningMaterialsData - 数据库学习资料
 * @returns {string} 生成的提示词
 */
export function generateDatabasePrompt(
  surveyData: SurveyFormData, 
  daysUntilExam: number,
  examDate: Date,
  isLongTermPlan: boolean,
  planGenerationDays: number,
  learningMaterialsData: any
): string {
  // 获取职称级别
  const titleLevel = surveyData.titleLevel === 'junior' ? '初级护师' : 
                     surveyData.titleLevel === 'mid' ? '主管护师' : 
                     surveyData.otherTitleLevel;
  
  // 获取相关中文描述
  const examStatus = surveyData.examStatus === 'first' ? '首次参加考试' : '已通过部分科目';
  
  // 学习基础描述
  const studyBaseDescription = generateStudyBaseDescription(surveyData);
  
  // 学习时间描述
  const weekdaysCountDesc = getWeekdaysCountDescription(surveyData.weekdaysCount);
  const weekdayHoursDesc = getHoursDescription(surveyData.weekdayHours, '工作日');
  const weekendHoursDesc = getHoursDescription(surveyData.weekendHours, '周末');
  
  // 将数据库学习资料转换为JSON字符串
  const learningMaterialsJson = JSON.stringify(learningMaterialsData, null, 2);
  
  // 构建提示词
  return `你是一位专业的医卫职称备考规划专家，擅长为医疗从业人员制定个性化的备考计划。
请根据以下用户信息以及数据库中的实际学习资料生成一个详细的备考规划。

## 用户基本信息
- 报考职称: ${titleLevel}
- 考试状态: ${examStatus}
- 学习基础: ${studyBaseDescription}
- 学习时间安排: 
  * 每周工作日学习: ${weekdaysCountDesc}
  * ${weekdayHoursDesc}
  * ${weekendHoursDesc}
- 距离考试还有${daysUntilExam}天，考试日期: ${examDate.toLocaleDateString('zh-CN')}

## 规划需求说明
距离考试还有${daysUntilExam}天，${isLongTermPlan ? `但用户只需要近${planGenerationDays}天的详细每日规划` : '需要完整的每日规划'}。
请设计一个满足以下要求的备考规划：
1. 必须包含完整的三个学习阶段（基础、强化、冲刺），并根据总备考时间${daysUntilExam}天合理分配各阶段时长
2. ${isLongTermPlan ? `仅提供前${planGenerationDays}天的详细每日学习任务，之后用户将根据进度进行重新规划` : '提供完整每日规划'}
3. 每个阶段必须有明确的学习重点和目标
4. 学习资源必须基于数据库中提供的实际资料
5. 考虑用户的学习基础、可用时间，提供最适合的进度安排

## 数据库中的学习资料
${learningMaterialsJson}

## 请返回以下JSON格式的规划
请返回一个JSON对象，包含以下内容(字段名称保持英文，内容使用中文):

{
  "overview": "整体备考规划总览，描述整个备考周期的学习安排、关键建议和进度",
  "phases": [
    {
      "id": 1,
      "name": "基础学习阶段",
      "description": "阶段详细描述",
      "startDay": 1,
      "endDay": X, // 具体天数
      "focusAreas": ["重点领域1", "重点领域2", "..."],
      "learningGoals": ["目标1", "目标2", "..."],
      "recommendedResources": ["资源1", "资源2", "..."],
      "monthlyPlan": ${isLongTermPlan ? '"此阶段每月学习要点和建议，帮助用户了解长期规划"' : 'null'} // 仅长期规划需要
    },
    {
      "id": 2,
      "name": "重点强化阶段",
      "description": "阶段详细描述", 
      "startDay": X+1,
      "endDay": Y, // 具体天数
      "focusAreas": ["重点领域1", "重点领域2", "..."],
      "learningGoals": ["目标1", "目标2", "..."],
      "recommendedResources": ["资源1", "资源2", "..."],
      "monthlyPlan": ${isLongTermPlan ? '"此阶段每月学习要点和建议，帮助用户了解长期规划"' : 'null'} // 仅长期规划需要
    },
    {
      "id": 3,
      "name": "模拟冲刺阶段",
      "description": "阶段详细描述",
      "startDay": Y+1,
      "endDay": ${daysUntilExam}, // 到考试前一天
      "focusAreas": ["重点领域1", "重点领域2", "..."],
      "learningGoals": ["目标1", "目标2", "..."],
      "recommendedResources": ["资源1", "资源2", "..."],
      "monthlyPlan": ${isLongTermPlan ? '"此阶段每月学习要点和建议，帮助用户了解长期规划"' : 'null'} // 仅长期规划需要
    }
  ],
  "dailyPlans": [
    {
      "day": 1,
      "date": "YYYY-MM-DD", // 使用具体日期
      "phaseId": 1, // 对应上面phases中的id
      "title": "第1天学习计划标题",
      "subjects": ["学习科目1", "学习科目2", "..."],
      "tasks": [
        {
          "title": "任务1标题",
          "description": "任务1详细描述",
          "duration": 60, // 预计时长（分钟）
          "resources": ["资源链接或描述1", "资源链接或描述2"]
        },
        // 更多任务...
      ],
      "reviewTips": "当天复习建议"
    },
    // ${isLongTermPlan ? `只需生成前${planGenerationDays}天的每日计划` : `生成所有${daysUntilExam}天的每日计划`}
  ],
  ${isLongTermPlan ? `"nextSteps": "提供用户完成${planGenerationDays}天学习后的后续操作建议，如何评估进度、调整计划等"` : ''}
}

请特别注意：
1. 每日计划中的任务总时长应符合用户可用学习时间
2. 工作日和周末的学习安排应有差异，周末可安排更多时间的学习任务
3. 学习资源必须来自数据库中提供的学习资料，使用真实的学科名称和章节名称
4. 根据用户基础水平调整学习进度和难度
5. ${isLongTermPlan ? `每个阶段需要提供monthlyPlan，帮助用户了解长期学习规划` : ''}

请确保返回的JSON格式正确无误，能够被JavaScript的JSON.parse()直接解析。
返回的内容必须是一个完整且语法完全正确的JSON对象。所有括号（花括号{}和方括号[]）都必须正确配对并闭合。
绝对不要在JSON有效负载之外包含任何文本、注释、Markdown标记（如 \`\`\`json）或任何其他非JSON字符。
JSON字符串本身不应包含任何导致解析错误的控制字符或未转义的特殊字符。`;
} 