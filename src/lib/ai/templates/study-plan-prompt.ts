/**
 * @description 备考规划提示词模板 - 项目中唯一的官方提示词模板
 * @author 郝桃桃
 * @date 2024-09-29
 * @update 2024-10-01 确认为项目唯一提示词模板，旧版 legacy 文件不应继续使用
 * @note 此文件是生成备考规划提示词的唯一官方模板，
 *       所有提示词修改应在此文件中进行，不应创建额外的提示词文件。
 *       legacy_backup 目录中的旧文件 (db-router.js/ts, openrouter.ts 等) 已被此文件替代。
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
    '1-2': '每周 1-2 天',
    '3-4': '每周 3-4 天',
    '5': '每周 5 天'
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
      '<1': '工作日每天学习不到 1 小时',
      '1-2': '工作日每天学习 1-2 小时',
      '2-3': '工作日每天学习 2-3 小时',
      '3+': '工作日每天学习 3 小时以上'
    };
    return hoursMap[hours] || `${dayType}未知时长`;
  } else {
    const hoursMap: Record<string, string> = {
      '<2': '周末每天学习不到 2 小时',
      '2-4': '周末每天学习 2-4 小时',
      '4-6': '周末每天学习 4-6 小时',
      '6+': '周末每天学习 6 小时以上'
    };
    return hoursMap[hours] || `${dayType}未知时长`;
  }
}

/**
 * @description 生成学习基础描述文本，采用暖心鼓励式风格
 * @param {SurveyFormData} surveyData - 用户调查问卷数据
 * @returns {string} 学习基础描述
 */
export function generateStudyBaseDescription(surveyData: SurveyFormData): string {
  let studyBaseDescription = '';

  if(surveyData.examStatus === 'first') {
    studyBaseDescription = surveyData.overallLevel === 'weak' 
      ? '基础还需要加强，不过别担心，从头开始是最踏实的方式，我们会一步步陪你打好基础～' 
      : surveyData.overallLevel === 'medium' 
      ? '已经有不错的基础了，我们会帮你查漏补缺，针对性地加强薄弱环节～' 
      : '你的基础非常扎实，我们会帮你进一步提升，让复习更加高效～';
  } else {
    // 对于已通过部分科目的情况，列出需要考试的科目及基础水平，同时添加鼓励性话语
    studyBaseDescription = '你已经通过部分科目啦，真棒！下面是剩余科目的基础情况：\n';
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
    studyBaseDescription += '\n别担心，我们会根据你的基础情况制定针对性的学习计划，一起冲刺剩余科目～';
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
  return `你是一位专业、亲切的医卫职称备考规划专家，擅长为医疗从业人员制定个性化的备考计划，并给予暖心的鼓励。
请根据以下用户信息生成一个详细的备考规划，语气要温暖友好，像一位贴心的学习伙伴在与用户对话。

用户信息：
- 报考职称：${titleLevel}
- 考试状态：${examStatus}
- 学习基础：${studyBaseDescription}
- 学习时间安排：
  * 每周工作日学习：${weekdaysCountDesc}
  * ${weekdayHoursDesc}
  * ${weekendHoursDesc}
- 距离考试还有${daysUntilExam}天，考试日期：${examDate.toLocaleDateString('zh-CN')}

## 语气和风格要求
1. 总览部分：要让用户感受到这是为他们量身定制的备考方案，温暖地重申用户的目标和情况，简述三个阶段的规划，并给予鼓励。使用"我们一起"、"你可以"等词语，增加亲近感和支持感。
2. 阶段描述：不仅要描述学习内容，还要加入鼓励性的话语，如"这个阶段可能有些挑战，但我们会一步步来"或"完成这个阶段后，你会感到更有信心"等。
3. 每日任务：描述要轻松活泼，让学习过程看起来不那么枯燥，比如"今天我们来探索..."、"今天的内容很有趣..."等。

请返回一个 JSON 对象，包含以下内容 (字段名称保持英文，内容使用中文):

{
  "overview": "整体备考规划总览。要体现个性化（重申用户目标与时间），概述三个阶段安排，使用暖心鼓励的语气，如同一位贴心的学习伙伴在与用户对话",
  "phases": [
    {
      "id": 1,
      "name": "基础学习阶段",
      "description": "阶段详细描述，不仅要描述内容，还要加入鼓励性话语，像一位陪伴者在说话",
      "startDay": 1,
      "endDay": X, // 具体天数
      "focusAreas": ["重点 1", "重点 2", "..."],
      "learningGoals": ["目标 1", "目标 2", "..."],
      "recommendedResources": ["资源 1", "资源 2", "..."]
    },
    {
      "id": 2,
      "name": "重点强化阶段",
      "description": "阶段详细描述，保持暖心鼓励的风格",
      "startDay": X+1,
      "endDay": Y, // 具体天数
      "focusAreas": ["重点 1", "重点 2", "..."],
      "learningGoals": ["目标 1", "目标 2", "..."],
      "recommendedResources": ["资源 1", "资源 2", "..."]
    },
    {
      "id": 3,
      "name": "模拟冲刺阶段",
      "description": "阶段详细描述，加入鼓励的话语，展现对用户的信心",
      "startDay": Y+1,
      "endDay": ${daysUntilExam}, // 到考试前一天
      "focusAreas": ["重点 1", "重点 2", "..."],
      "learningGoals": ["目标 1", "目标 2", "..."],
      "recommendedResources": ["资源 1", "资源 2", "..."]
    }
  ],
  "dailyPlans": [
    {
      "day": 1,
      "date": "YYYY-MM-DD", // 使用具体日期
      "phaseId": 1, // 对应上面 phases 中的 id
      "title": "第 1 天学习计划标题，可以活泼一些，例如"探索护理基础的第一天"",
      "subjects": ["学习科目 1", "学习科目 2", "..."],
      "tasks": [
        {
          "title": "任务 1 标题，保持轻松活泼的语气",
          "description": "任务 1 详细描述，用轻松愉悦的语气描述任务内容，减轻用户的学习压力",
          "duration": 60, // 预计时长（分钟）
          "resources": ["资源链接或描述 1", "资源链接或描述 2"]
        },
        // 更多任务...
      ],
      "reviewTips": "当天复习建议，语气要轻松鼓励，如"今天学习了不少内容，简单复习一下就好，别给自己太大压力~""
    },
    // 每天一条记录，直到考试前一天 (day: ${daysUntilExam})
  ]
}

请根据用户的职称等级、考试状态、学习基础和可用学习时间自定义规划。确保：
1. 三个阶段时长按照备考时间合理分配（基础：强化：冲刺 大致为 4:3:3 或根据学习基础调整）
2. 每日计划要考虑用户可用的学习时间，工作日和周末分配不同的学习量
3. 每个任务的时长应该合理且加起来不超过用户当天可用的学习时间
4. 学习资源要具体且有实用性，例如《xxx 教材第 n 章》、"护理技能操作视频"等

请确保返回的 JSON 格式正确，便于系统解析。请不要在 JSON 前后添加任何额外的说明或描述。`;
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

  // 将数据库学习资料转换为 JSON 字符串
  const learningMaterialsJson = JSON.stringify(learningMaterialsData, null, 2);

  // 构建提示词
  return `你是一位专业、亲切的医卫职称备考规划专家，擅长为医疗从业人员制定个性化的备考计划，并给予暖心的鼓励。
请根据以下用户信息以及数据库中的实际学习资料生成一个详细的备考规划，语气要温暖友好，像一位贴心的学习伙伴在与用户对话。

## 用户基本信息
- 报考职称：${titleLevel}
- 考试状态：${examStatus}
- 学习基础：${studyBaseDescription}
- 学习时间安排：
  * 每周工作日学习：${weekdaysCountDesc}
  * ${weekdayHoursDesc}
  * ${weekendHoursDesc}
- 距离考试还有${daysUntilExam}天，考试日期：${examDate.toLocaleDateString('zh-CN')}

## 规划需求说明
距离考试还有${daysUntilExam}天，${isLongTermPlan ? `但用户只需要近${planGenerationDays}天的详细每日规划` : '需要完整的每日规划'}。

## 重要指示
1. 初级护师考试包含四个科目：基础知识、相关专业知识、专业知识和专业实践能力
2. 虽然规划会包含所有四个科目，但实际内容将重点关注"专业实践能力"科目 (ID 为 4) 的学习
3. 当前数据库中主要有"专业实践能力"科目 (ID 为 4) 与"基础护理学"学科 (ID 为 4) 相关的详细内容
4. 请利用现有数据库中的知识点和章节构建学习计划，专注于基础护理学的内容
5. 对于其他三个科目，只需在规划中做简要安排，不需要详细内容

## 语气和风格要求
1. 总览部分：要让用户感受到这是为他们量身定制的备考方案，温暖地重申用户的目标和情况，简述三个阶段的规划，并给予鼓励。使用"我们一起"、"你可以"等词语，增加亲近感和支持感。
2. 阶段描述：不仅要描述学习内容，还要加入鼓励性的话语，如"这个阶段可能有些挑战，但我们会一步步来"或"完成这个阶段后，你会感到更有信心"等。
3. 每日任务：描述要轻松活泼，让学习过程看起来不那么枯燥，比如"今天我们来探索..."、"今天的内容很有趣..."等。

请设计一个满足以下要求的备考规划：
1. 必须包含完整的三个学习阶段（基础、强化、冲刺），并根据总备考时间${daysUntilExam}天合理分配各阶段时长
2. ${isLongTermPlan ? `仅提供前${planGenerationDays}天的详细每日学习任务，之后用户将根据进度进行重新规划` : '提供完整每日规划'}
3. 每个阶段必须有明确的学习重点和目标，并配以鼓励性话语
4. 学习资源必须基于数据库中提供的实际资料，特别是基础护理学的章节和知识点
5. 考虑用户的学习基础、可用时间，提供最适合的进度安排
6. 在每日规划中，专业实践能力科目应占据主要学习时间（约 70%），其他三个科目共占 30%

## 数据库中的学习资料
${learningMaterialsJson}

## 请返回以下 JSON 格式的规划
请返回一个 JSON 对象，包含以下内容 (字段名称保持英文，内容使用中文):

{
  "overview": "整体备考规划总览。要体现个性化（重申用户目标与时间），概述三个阶段安排，使用暖心鼓励的语气，如同一位贴心的学习伙伴在与用户对话",
  "phases": [
    {
      "id": 1,
      "name": "基础学习阶段",
      "description": "阶段详细描述，不仅要描述内容，还要加入鼓励性话语，像一位陪伴者在说话",
      "startDay": 1,
      "endDay": X, // 具体天数
      "focusAreas": ["重点 1", "重点 2", "..."],
      "learningGoals": ["目标 1", "目标 2", "..."],
      "recommendedResources": ["资源 1", "资源 2", "..."]
    },
    {
      "id": 2,
      "name": "重点强化阶段",
      "description": "阶段详细描述，保持暖心鼓励的风格",
      "startDay": X+1,
      "endDay": Y, // 具体天数
      "focusAreas": ["重点 1", "重点 2", "..."],
      "learningGoals": ["目标 1", "目标 2", "..."],
      "recommendedResources": ["资源 1", "资源 2", "..."]
    },
    {
      "id": 3,
      "name": "模拟冲刺阶段",
      "description": "阶段详细描述，加入鼓励的话语，展现对用户的信心",
      "startDay": Y+1,
      "endDay": ${daysUntilExam}, // 到考试前一天
      "focusAreas": ["重点 1", "重点 2", "..."],
      "learningGoals": ["目标 1", "目标 2", "..."],
      "recommendedResources": ["资源 1", "资源 2", "..."]
    }
  ],
  "dailyPlans": [
    {
      "day": 1,
      "date": "YYYY-MM-DD", // 使用具体日期
      "phaseId": 1, // 对应上面 phases 中的 id
      "title": "第 1 天学习计划标题，可以活泼一些，例如"探索护理基础的第一天"",
      "subjects": ["学习科目 1", "学习科目 2", "..."],
      "tasks": [
        {
          "title": "任务 1 标题，保持轻松活泼的语气",
          "description": "任务 1 详细描述，用轻松愉悦的语气描述任务内容，减轻用户的学习压力",
          "duration": 60, // 预计时长（分钟）
          "resources": ["资源链接或描述 1", "资源链接或描述 2"]
        },
        // 更多任务...
      ],
      "reviewTips": "当天复习建议，语气要轻松鼓励，如"今天学习了不少内容，简单复习一下就好，别给自己太大压力~""
    },
    // ${isLongTermPlan ? `只需生成前${planGenerationDays}天的每日计划` : `生成所有${daysUntilExam}天的每日计划`}
  ],
  ${isLongTermPlan ? `"nextSteps": "提供用户完成${planGenerationDays}天学习后的后续操作建议，如何评估进度、调整计划等，语气要暖心鼓励"` : ''}
}

请特别注意：
1. 每日计划中的任务总时长应符合用户可用学习时间
2. 工作日和周末的学习安排应有差异，周末可安排更多时间的学习任务
3. 学习资源必须来自数据库中提供的学习资料，重点使用基础护理学 (ID 为 4) 的章节和知识点作为"专业实践能力"科目的主要内容
4. 根据用户基础水平调整学习进度和难度
5. ${isLongTermPlan ? `每个阶段需要提供monthlyPlan，帮助用户了解长期学习规划` : ''}
6. 其他三个科目（基础知识、相关专业知识、专业知识）在规划中应该有所体现，但可以简化内容，重点仍放在"专业实践能力"科目上
7. 所有内容都要采用暖心陪伴式的语气，就像一位贴心的学习伙伴在指导用户

请确保返回的 JSON 格式正确无误，能够被 JavaScript 的 JSON.parse() 直接解析。
返回的内容必须是一个完整且语法完全正确的 JSON 对象。所有括号（花括号{}和方括号 []）都必须正确配对并闭合。
绝对不要在 JSON 有效负载之外包含任何文本、注释、Markdown 标记（如 \`\`\`json）或任何其他非JSON字符。
JSON字符串本身不应包含任何导致解析错误的控制字符或未转义的特殊字符。`;
} 