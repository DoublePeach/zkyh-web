/**
 * @description OpenRouter API服务，用于AI模型调用
 * @author 郝桃桃
 * @date 2023-10-01
 */

import { SurveyFormData } from '@/types/survey';

// OpenRouter API密钥
const OPENROUTER_API_KEY = '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';

// 应用信息
const APP_URL = 'https://medical-cert-exam-prep.vercel.app';
const APP_NAME = 'MedCertExamPrep';

/**
 * @description 从OpenRouter获取备考方案
 * @param {SurveyFormData} surveyData - 用户调查问卷数据
 * @returns {Promise<any>} - AI生成的备考方案
 */
export async function generateStudyPlan(surveyData: SurveyFormData): Promise<any> {
  try {
    console.log('开始生成备考方案...');
    
    // 计算距离考试的天数
    const examDate = new Date(surveyData.examDate);
    const today = new Date();
    const daysUntilExam = Math.max(1, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    console.log(`距离考试还有${daysUntilExam}天`);
    
    // 获取专业类别、职称等级和学习时间的中文描述
    const professionInChinese = getProfessionName(surveyData.profession);
    const currentTitleInChinese = getTitleName(surveyData.currentTitle);
    const targetTitleInChinese = getTitleName(surveyData.targetTitle);
    const studyTimeInChinese = getStudyTimeName(surveyData.studyTimePerDay);
    
    // 构建中文提示词
    const prompt = `你是一位专业的医卫职称备考规划专家，请根据以下用户信息生成一个详细的备考规划，包括学习模块和每日任务安排。

用户信息:
- 专业类别: ${professionInChinese}
- 当前职称: ${currentTitleInChinese}
- 目标职称: ${targetTitleInChinese}
- 每日可用学习时间: ${studyTimeInChinese}
- 距离考试还有${daysUntilExam}天

请返回一个JSON对象，包含以下内容(字段名称保持英文，内容使用中文):
1. 备考方案总览(overview)：简要描述整体备考安排和建议
2. 学习模块(modules)：数组，包含5-10个学习模块，每个模块包含:
   - 标题(title)
   - 描述(description)
   - 重要性(importance)：1-10分
   - 难度(difficulty)：1-10分
   - 持续天数(durationDays)
   - 顺序(order)
3. 每个模块的每日任务(tasks)：每个模块包含多个每日任务，每个任务包含:
   - 所属模块索引(moduleIndex)
   - 第几天(day)
   - 标题(title)
   - 描述(description)
   - 学习内容(learningContent)
   - 预计完成时间(estimatedMinutes)：分钟

备考规划应根据用户的专业类别、目标职称和可用学习时间定制，总天数不应超过用户距离考试的天数。
请确保返回的JSON格式正确，便于系统解析。请不要在JSON前后添加任何额外的说明或描述。`;

    // 准备API请求数据 - 使用UTF-8编码的中文内容
    const requestData = {
      model: 'anthropic/claude-3-opus:beta',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    };
    
    // 将请求数据转换为UTF-8编码的JSON字符串
    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8');
    
    // 创建Blob对象确保字符串正确编码为UTF-8
    const jsonString = JSON.stringify(requestData);
    const blob = new Blob([encoder.encode(jsonString)], { type: 'application/json; charset=utf-8' });
    const requestBody = await blob.text();
    
    console.log('准备发送请求到OpenRouter API...');
    
    // 使用fetch API发送请求，确保正确设置Content-Type头部
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': APP_URL,
        'X-Title': APP_NAME,
      },
      body: requestBody,
    });
    
    // 处理响应
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API错误:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: '无法解析错误响应' };
      }
      console.error('解析后的错误:', errorData);
      throw new Error(`OpenRouter API调用失败: ${response.statusText}`);
    }
    
    console.log('OpenRouter API响应成功，正在解析结果...');
    const responseBuffer = await response.arrayBuffer();
    const responseText = decoder.decode(responseBuffer);
    console.log('响应长度:', responseText.length);
    
    // 调试日志：输出响应片段
    console.log('响应预览:', responseText.substring(0, 500) + '...');
    
    let data;
    try {
      console.log('大模型返回的原始相应response：',response);
      console.log('开始解析API响应JSON （responseText）:', responseText);
      data = JSON.parse(responseText);
      console.log('解析后的数据:', data);
    } catch (e) {
      console.error('无法解析API响应JSON:', e);
      console.error('原始响应长度:', responseText.length);
      throw new Error('无法解析API响应');
    }
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('OpenRouter API返回了不正确的数据格式:', data);
      throw new Error('OpenRouter API返回了不正确的数据格式');
    }
    
    // 从响应中提取内容
    const contentText = data.choices[0].message.content;
    console.log('内容文本长度:', contentText.length);
    console.log('内容预览:', contentText.substring(0, 500) + '...');
    
    try {
      // 尝试直接解析内容
      return tryParseJSON(contentText);
    } catch (parseError) {
      console.error('无法解析返回的内容:', parseError);
      
      // 手动实现：创建备选备考方案
      return createFallbackStudyPlan(professionInChinese, targetTitleInChinese, daysUntilExam);
    }
  } catch (error) {
    console.error('生成备考方案失败:', error);
    throw error;
  }
}

/**
 * @description 获取专业名称
 */
function getProfessionName(profession: string): string {
  const map: Record<string, string> = {
    'medical': '医疗类',
    'nursing': '护理类',
    'pharmacy': '药技类'
  };
  return map[profession] || '未知专业';
}

/**
 * @description 获取职称名称
 */
function getTitleName(title: string): string {
  const map: Record<string, string> = {
    'none': '无职称',
    'junior': '初级职称',
    'mid': '中级职称',
    'associate': '副高级',
    'senior': '正高级'
  };
  return map[title] || '未知职称';
}

/**
 * @description 获取学习时间描述
 */
function getStudyTimeName(studyTime: string): string {
  const map: Record<string, string> = {
    '<1': '少于1小时',
    '1-2': '1-2小时',
    '2-4': '2-4小时',
    '4+': '4小时以上'
  };
  return map[studyTime] || '未知学习时间';
}

/**
 * 尝试解析JSON，带有更好的错误处理
 * @param text 要解析的JSON字符串
 */
function tryParseJSON(text: string): any {
  try {
    // 先尝试直接解析
    return JSON.parse(text);
  } catch (e) {
    console.log('初始解析失败，尝试清理字符串...');
    
    // 有时LLM会在JSON前后添加额外文本
    // 尝试通过查找{和}对来查找JSON结构
    let startIdx = text.indexOf('{');
    let endIdx = text.lastIndexOf('}');
    
    if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
      let jsonText = text.substring(startIdx, endIdx + 1);
      try {
        return JSON.parse(jsonText);
      } catch (e2) {
        console.error('第二次解析尝试失败');
      }
    }
    
    // 如果仍然失败，尝试更激进的方法
    // 查找"overview"属性
    const overviewMatch = text.match(/"overview"\s*:\s*"[^"]*"/);
    if (overviewMatch && overviewMatch.index !== undefined) {
      // 查找整个JSON对象
      let bracketCount = 0;
      let foundStart = false;
      let start = 0;
      let end = text.length - 1;
      
      // 从overview向后搜索，找到开始的大括号
      for (let i = overviewMatch.index; i >= 0; i--) {
        if (text[i] === '{') {
          foundStart = true;
          start = i;
          break;
        }
      }
      
      // 向前搜索，找到正确的结束大括号
      if (foundStart) {
        for (let i = start; i < text.length; i++) {
          if (text[i] === '{') bracketCount++;
          if (text[i] === '}') bracketCount--;
          if (bracketCount === 0) {
            end = i;
            break;
          }
        }
        
        if (bracketCount === 0) {
          try {
            return JSON.parse(text.substring(start, end + 1));
          } catch (e3) {
            console.error('第三次解析尝试失败');
          }
        }
      }
    }
    
    // 所有解析尝试都失败
    throw new Error('无法解析内容: ' + e);
  }
}

/**
 * 当解析失败时创建一个备选备考方案
 */
function createFallbackStudyPlan(profession: string, targetTitle: string, daysUntilExam: number): any {
  console.log('创建备选备考方案');
  
  // 创建一个基本的方案，包含较少的模块/任务
  const daysPerModule = Math.max(3, Math.min(7, Math.floor(daysUntilExam / 5)));
  const numModules = Math.min(5, Math.floor(daysUntilExam / daysPerModule));
  
  const modules = [];
  const tasks = [];
  
  // 根据专业获取常见模块主题
  const moduleTopics = getProfessionModules(profession);
  
  // 创建模块
  for (let i = 0; i < numModules; i++) {
    const topic = moduleTopics[i % moduleTopics.length];
    modules.push({
      title: topic.title,
      description: topic.description,
      importance: 8,
      difficulty: 7,
      durationDays: daysPerModule,
      order: i + 1
    });
    
    // 每个模块添加2-3个任务
    const tasksPerModule = Math.min(3, daysPerModule);
    for (let j = 0; j < tasksPerModule; j++) {
      tasks.push({
        moduleIndex: i,
        day: i * daysPerModule + j + 1,
        title: `${topic.title} - 第${j+1}天`,
        description: `学习${topic.title}的基础知识和关键概念。`,
        learningContent: `阅读相关章节，完成${topic.title}的练习题。`,
        estimatedMinutes: 120
      });
    }
  }
  
  return {
    overview: `这是一个为期${daysUntilExam}天的${profession}专业人员准备${targetTitle}认证的学习计划。重点关注关键模块和每日任务。`,
    modules,
    tasks
  };
}

/**
 * 根据专业获取模块主题
 */
function getProfessionModules(profession: string): Array<{title: string, description: string}> {
  if (profession.includes('护理')) {
    return [
      { title: '护理学基础', description: '核心护理概念和患者护理。' },
      { title: '护理评估', description: '全面的患者评估技术。' },
      { title: '药理学', description: '药物管理和药物知识。' },
      { title: '内外科护理', description: '各种医疗条件下的患者护理。' },
      { title: '专科护理', description: '儿科、产科和精神科护理。' }
    ];
  } else if (profession.includes('医疗')) {
    return [
      { title: '临床诊断', description: '诊断程序和评估。' },
      { title: '药物治疗', description: '治疗性药物管理。' },
      { title: '内科医学', description: '常见医疗条件和治疗。' },
      { title: '专科领域', description: '心脏病学、神经病学和其他专科。' },
      { title: '患者管理', description: '全面的护理计划和执行。' }
    ];
  } else {
    return [
      { title: '药物学', description: '药物分类和应用。' },
      { title: '药房实践', description: '配药程序和规定。' },
      { title: '临床药学', description: '以患者为中心的药物护理。' },
      { title: '药物计算', description: '剂量计算和配方。' },
      { title: '药事法规', description: '药房实践的法律和伦理方面。' }
    ];
  }
} 