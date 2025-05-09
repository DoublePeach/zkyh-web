/**
 * @description 处理Claude返回的截断JSON响应 - 专门处理学习计划的截断问题
 * @author 郝桃桃
 * @date 2024-10-13
 */

/**
 * @description 特殊处理Claude生成的截断学习计划
 * @param {string} truncatedJson - 截断的JSON字符串
 * @param {number} knowledgePointsCount - 知识点总数
 * @param {number} requiredDays - 需要生成的天数
 * @returns {any} 处理后的JSON对象
 */
export function processClaudeTruncatedStudyPlan(truncatedJson: string, knowledgePointsCount: number = 30, requiredDays: number = 30): any {
  // 提取已有的JSON部分
  const baseStructure = extractBaseStructure(truncatedJson);
  
  // 确保phases部分完整
  ensurePhases(baseStructure);
  
  // 生成缺失的每日计划
  generateMissingDailyPlans(baseStructure, knowledgePointsCount, requiredDays);
  
  return baseStructure;
}

/**
 * @description 从截断的JSON字符串中提取基础结构
 * @param {string} truncatedJson - 截断的JSON字符串
 * @returns {any} 提取的JSON对象
 */
function extractBaseStructure(truncatedJson: string): any {
  try {
    // 1. 尝试直接解析（可能会失败）
    try {
      return JSON.parse(truncatedJson);
    } catch (error) {
      console.log('直接解析失败，尝试提取有效部分');
    }
    
    // 2. 确保基础结构存在
    const structure: any = {
      overview: '',
      phases: [],
      dailyPlans: []
    };
    
    // 3. 提取overview
    const overviewMatch = /"overview"\s*:\s*"([^"]*?)(?:"|$)/.exec(truncatedJson);
    if (overviewMatch && overviewMatch[1]) {
      structure.overview = overviewMatch[1];
    }
    
    // 4. 尝试提取phases数组
    try {
      const phasesMatch = /"phases"\s*:\s*(\[[\s\S]*?(?:\]|$))/.exec(truncatedJson);
      if (phasesMatch && phasesMatch[1]) {
        // 尝试修复并解析phases数组
        const fixedPhasesJson = ensureJsonArray(phasesMatch[1]);
        try {
          const phases = JSON.parse(fixedPhasesJson);
          if (Array.isArray(phases)) {
            structure.phases = phases;
          }
        } catch (error) {
          console.log('解析phases数组失败，尝试提取单个phase');
          // 尝试提取单个phase对象
          const phaseObjects = extractObjectsFromArray(phasesMatch[1]);
          if (phaseObjects.length > 0) {
            structure.phases = phaseObjects;
          }
        }
      }
    } catch (error) {
      console.log('提取phases失败:', error);
    }
    
    // 5. 尝试提取dailyPlans数组
    try {
      const dailyPlansMatch = /"dailyPlans"\s*:\s*(\[[\s\S]*?(?:\]|$))/.exec(truncatedJson);
      if (dailyPlansMatch && dailyPlansMatch[1]) {
        // 尝试修复并解析dailyPlans数组
        const fixedDailyPlansJson = ensureJsonArray(dailyPlansMatch[1]);
        try {
          const dailyPlans = JSON.parse(fixedDailyPlansJson);
          if (Array.isArray(dailyPlans)) {
            structure.dailyPlans = dailyPlans;
          }
        } catch (error) {
          console.log('解析dailyPlans数组失败，尝试提取单个plan');
          // 尝试提取单个dailyPlan对象
          const dailyPlanObjects = extractObjectsFromArray(dailyPlansMatch[1]);
          if (dailyPlanObjects.length > 0) {
            structure.dailyPlans = dailyPlanObjects;
          }
        }
      }
    } catch (error) {
      console.log('提取dailyPlans失败:', error);
    }
    
    return structure;
  } catch (error) {
    console.error('处理截断JSON失败:', error);
    return {
      overview: '无法解析学习计划数据，请重试',
      phases: [],
      dailyPlans: []
    };
  }
}

/**
 * @description 确保JSON数组格式正确，处理可能的截断问题
 * @param {string} arrayText - JSON数组文本
 * @returns {string} 修复后的JSON数组文本
 */
function ensureJsonArray(arrayText: string): string {
  // 确保数组是以 [ 开头
  if (!arrayText.trim().startsWith('[')) {
    arrayText = '[' + arrayText;
  }
  
  // 确保数组是以 ] 结尾
  if (!arrayText.trim().endsWith(']')) {
    // 查找最后一个完整的对象
    const lastObjectEndIndex = arrayText.lastIndexOf('}');
    if (lastObjectEndIndex !== -1) {
      arrayText = arrayText.substring(0, lastObjectEndIndex + 1) + ']';
    } else {
      arrayText = arrayText + ']';
    }
  }
  
  // 修复可能的逗号问题
  arrayText = arrayText.replace(/,\s*\]/g, ']');
  
  return arrayText;
}

/**
 * @description 从数组文本中提取对象
 * @param {string} arrayText - 数组文本
 * @returns {any[]} 提取的对象数组
 */
function extractObjectsFromArray(arrayText: string): any[] {
  const objects: any[] = [];
  let depth = 0;
  let startPos = -1;
  
  // 遍历寻找对象边界
  for (let i = 0; i < arrayText.length; i++) {
    if (arrayText[i] === '{') {
      if (depth === 0) {
        startPos = i;
      }
      depth++;
    } else if (arrayText[i] === '}') {
      depth--;
      if (depth === 0 && startPos !== -1) {
        try {
          const objText = arrayText.substring(startPos, i + 1);
          const obj = JSON.parse(objText);
          objects.push(obj);
        } catch (error) {
          // 忽略无法解析的对象
        }
        startPos = -1;
      }
    }
  }
  
  return objects;
}

/**
 * @description 确保phases完整
 * @param {any} structure - 学习计划结构
 */
function ensurePhases(structure: any): void {
  // 如果phases不存在或为空，创建三个默认阶段
  if (!structure.phases || !Array.isArray(structure.phases) || structure.phases.length === 0) {
    structure.phases = [
      {
        id: 1,
        name: "基础学习阶段",
        description: "这个阶段我们将重点打好基础护理学的基础，一步步构建你的护理知识体系。虽然初看内容较多，但我们会用简单易懂的方式，让你轻松掌握这些必备知识。",
        startDay: 1,
        endDay: 10,
        focusAreas: ["基础护理学基本概念", "护理程序", "沟通技巧"],
        learningGoals: ["掌握护理学基本理论", "理解护理程序的步骤和应用"],
        recommendedResources: ["《基础护理学》教材第1-3章", "护理操作视频教程"]
      },
      {
        id: 2,
        name: "重点强化阶段",
        description: "现在我们将深入到更具体的护理技能和知识点中。这个阶段可能会有些挑战，但你已经有了坚实的基础，我相信你完全可以应对！",
        startDay: 11,
        endDay: 20,
        focusAreas: ["专科护理技能", "常见疾病护理", "病例分析"],
        learningGoals: ["熟练掌握各种护理技能", "能够进行基础病例分析"],
        recommendedResources: ["《基础护理学》教材第4-6章", "护理案例分析集"]
      },
      {
        id: 3,
        name: "模拟冲刺阶段",
        description: "最后阶段我们将通过模拟考试和综合练习巩固所学知识。这个阶段主要是查漏补缺，建立知识体系，增强你的应试能力和自信心！",
        startDay: 21,
        endDay: 30,
        focusAreas: ["综合模拟练习", "往年真题", "考点梳理"],
        learningGoals: ["熟悉考试题型", "掌握答题技巧", "建立完整知识体系"],
        recommendedResources: ["历年护理考试真题", "模拟试题集", "考点精讲视频"]
      }
    ];
  }
}

/**
 * @description 生成缺失的每日计划
 * @param {any} structure - 学习计划结构
 * @param {number} knowledgePointsCount - 知识点总数
 * @param {number} requiredDays - 需要生成的天数
 */
function generateMissingDailyPlans(structure: any, knowledgePointsCount: number, requiredDays: number): void {
  // 如果结构中没有dailyPlans或长度不够，生成缺失的日计划
  const currentPlans = structure.dailyPlans || [];
  const pointsPerDay = Math.ceil(knowledgePointsCount / requiredDays);
  
  for (let day = currentPlans.length + 1; day <= requiredDays; day++) {
    // 确定当前日期所属阶段
    let phaseId = 1;
    if (day > 20) {
      phaseId = 3;
    } else if (day > 10) {
      phaseId = 2;
    }
    
    // 计算日期
    const today = new Date();
    const currentDate = new Date();
    currentDate.setDate(today.getDate() + day - 1);
    const dateString = currentDate.toISOString().split('T')[0];
    
    // 创建日计划
    const dailyPlan = {
      day: day,
      date: dateString,
      phaseId: phaseId,
      title: `第${day}天 - 基础护理学习进行时`,
      subjects: ["基础护理学", "护理操作技能"],
      tasks: [
        {
          title: `学习基础护理知识点(${day})`,
          description: `今天，我们来学习第${day}天的护理知识点，内容涉及到基础护理学的重要概念和技能。`,
          duration: 90,
          resources: ["《基础护理学》教材", "护理技能操作视频"]
        },
        {
          title: "护理技能练习",
          description: "通过实际操作练习，巩固今天学习的护理技能，确保能够准确执行各项护理程序。",
          duration: 60,
          resources: ["基础护理操作指南", "操作技能自评表"]
        }
      ],
      reviewTips: "今天的学习内容较多，建议晚上花30分钟回顾笔记，特别是操作步骤部分。复习不需要压力太大，重点理解而非死记硬背~"
    };
    
    // 添加到计划中
    structure.dailyPlans.push(dailyPlan);
  }
}

export default processClaudeTruncatedStudyPlan; 