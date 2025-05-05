/**
 * @description OpenRouter API服务，用于AI模型调用
 * @author 郝桃桃
 * @date 2023-10-01
 */

import { SurveyFormData } from '@/types/survey';

// Define a more specific type for the AI response structure if possible
interface AIResponseData {
    overview: string;
    modules: Array<{ title: string; description: string; importance: number; difficulty: number; durationDays: number; order: number; }>;
    tasks: Array<{ moduleIndex: number; day: number; title: string; description: string; learningContent: string; estimatedMinutes: number; }>;
}

// OpenRouter API密钥
const OPENROUTER_API_KEY = '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';

// 应用信息
const APP_URL = 'https://medical-cert-exam-prep.vercel.app';
const APP_NAME = 'MedCertExamPrep';

/**
 * @description 带有重试机制的fetch函数
 * @param {string} url - 请求URL
 * @param {RequestInit} options - fetch选项
 * @param {number} retries - 重试次数
 * @param {number} retryDelay - 重试延迟(ms)
 * @param {number} timeout - 超时时间(ms)
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  retryDelay = 1000,
  timeout = 30000
): Promise<Response> {
  return new Promise(async (resolve, reject) => {
    // 设置超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // 添加signal到options
    const fetchOptions = {
      ...options,
      signal: controller.signal,
    };
    
    let lastError: Error | null = null;
    
    // 尝试请求，最多重试指定次数
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`API请求尝试 ${i + 1}/${retries}...`);
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        resolve(response);
        return;
      } catch (error) {
        console.error(`API请求失败 (尝试 ${i + 1}/${retries}):`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // 如果已达到最大重试次数或是被用户取消的请求，不再重试
        if (i === retries - 1 || (error instanceof Error && error.name === 'AbortError')) {
          break;
        }
        
        // 等待一段时间后重试
        await new Promise(r => setTimeout(r, retryDelay));
      }
    }
    
    // 所有重试都失败
    clearTimeout(timeoutId);
    reject(lastError || new Error('所有API请求尝试都失败'));
  });
}

/**
 * @description 从OpenRouter获取备考方案
 * @param {SurveyFormData} surveyData - 用户调查问卷数据
 * @returns {Promise<AIResponseData>} - AI生成的备考方案
 */
export async function generateStudyPlan(surveyData: SurveyFormData): Promise<AIResponseData> {
  // 获取职称级别和考试天数，供任何地方使用（包括错误处理）
  const examYear = parseInt(surveyData.examYear);
  const examDate = new Date(examYear, 3, 13); // 月份从0开始，所以4月是3
  const today = new Date();
  const daysUntilExam = Math.max(1, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  
  // 获取职称级别
  const titleLevel = surveyData.titleLevel === 'junior' ? '初级护师' : 
                    surveyData.titleLevel === 'mid' ? '主管护师' : 
                    surveyData.otherTitleLevel;
  
  try {
    console.log('开始生成备考方案...');
    
    console.log(`距离考试还有${daysUntilExam}天`);
    
    // 获取相关中文描述
    const examStatus = surveyData.examStatus === 'first' ? '首次参加考试' : '已通过部分科目';
    
    // 生成学习基础描述
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
    
    // 学习时间描述
    const weekdaysCountDesc = getWeekdaysCountDescription(surveyData.weekdaysCount);
    const weekdayHoursDesc = getHoursDescription(surveyData.weekdayHours, '工作日');
    const weekendHoursDesc = getHoursDescription(surveyData.weekendHours, '周末');
    
    // 构建中文提示词
    const prompt = `你是一位专业的医卫职称备考规划专家，请根据以下用户信息生成一个详细的备考规划，包括学习模块和每日任务安排。

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

备考规划应根据用户的职称等级、考试状态、学习基础和可用学习时间定制，总天数不应超过用户距离考试的天数。
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
    const response = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
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
      console.log('使用备用方案...');
      return createFallbackStudyPlan(titleLevel, daysUntilExam);
    }
    
    console.log('OpenRouter API响应成功，正在解析结果...');
    const responseBuffer = await response.arrayBuffer();
    const responseText = decoder.decode(responseBuffer);
    console.log('响应长度:', responseText.length);
    
    // 调试日志：输出响应片段
    console.log('响应预览:', responseText.substring(0, 500) + '...');
    
    // Parse the *entire* API response first
    let apiResponseData: { choices?: { message?: { content?: string } }[] };
    try {
      apiResponseData = JSON.parse(responseText); 
    } catch (error: unknown) {
      console.error('无法解析API响应JSON:', error);
      throw new Error(`AI 请求失败: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Check the expected structure of the API response
    if (!apiResponseData.choices || !apiResponseData.choices[0] || !apiResponseData.choices[0].message || !apiResponseData.choices[0].message.content) {
      console.error('OpenRouter API返回了不正确的数据格式:', apiResponseData);
      throw new Error('OpenRouter API返回了不正确的数据格式');
    }
    
    // Extract the *content* string which should contain our desired JSON
    const contentText = apiResponseData.choices[0].message.content;
    console.log('内容文本长度:', contentText.length);
    console.log('内容预览:', contentText.substring(0, 500) + '...');
    
    // Now parse the contentText which should be the AIResponseData JSON
    try {
      return parseJsonResponse(contentText); // Parse the actual content
    } catch (parseError: unknown) {
      console.error('无法解析返回的内容:', parseError);
      return createFallbackStudyPlan(titleLevel, daysUntilExam);
    }
  } catch (error: unknown) {
    console.error('生成备考方案失败:', error);
    console.log('使用备用方案...');
    return createFallbackStudyPlan(titleLevel, daysUntilExam);
  }
}

/**
 * @description 获取学习基础水平描述
 */
function getLevelDescription(level: string): string {
  const map: Record<string, string> = {
    'low': '了解较少（★）',
    'medium': '一般了解（★★）',
    'high': '熟悉掌握（★★★）'
  };
  return map[level] || '未知水平';
}

/**
 * @description 获取工作日学习天数描述
 */
function getWeekdaysCountDescription(count: string): string {
  const map: Record<string, string> = {
    '1-2': '每周1-2天',
    '3-4': '每周3-4天',
    '5': '每个工作日（每周5天）'
  };
  return map[count] || '未指定天数';
}

/**
 * @description 获取学习时间描述
 */
function getHoursDescription(hours: string, type: string): string {
  let desc = '';
  
  if (type === '工作日') {
    desc = hours === '<1' ? '工作日每天学习不到1小时' :
           hours === '1-2' ? '工作日每天学习1-2小时' :
           hours === '2-3' ? '工作日每天学习2-3小时' :
           '工作日每天学习3小时以上';
  } else {
    desc = hours === '<2' ? '周末每天学习不到2小时' :
           hours === '2-4' ? '周末每天学习2-4小时' :
           hours === '4-6' ? '周末每天学习4-6小时' :
           '周末每天学习6小时以上';
  }
  
  return desc;
}

/**
 * 当解析失败时创建一个备选备考方案
 */
function createFallbackStudyPlan(titleLevel: string, daysUntilExam: number): AIResponseData {
  console.log('创建备选备考方案');
  
  // 创建一个基本的方案，包含较少的模块/任务
  const daysPerModule = Math.max(3, Math.min(7, Math.floor(daysUntilExam / 5)));
  const numModules = Math.min(5, Math.floor(daysUntilExam / daysPerModule));
  
  const modules = [];
  const tasks = [];
  
  // 根据职称等级获取常见模块主题
  const moduleTopics = getNursingModules();
  
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
    overview: `这是一个为期${daysUntilExam}天的护理专业人员准备${titleLevel}认证的学习计划。重点关注关键模块和每日任务。`,
    modules,
    tasks
  };
}

/**
 * 获取护理相关模块主题
 */
function getNursingModules(): Array<{title: string, description: string}> {
  return [
    { title: '护理学基础', description: '核心护理概念和患者护理。' },
    { title: '护理评估', description: '全面的患者评估技术。' },
    { title: '药理学', description: '药物管理和药物知识。' },
    { title: '内外科护理', description: '各种医疗条件下的患者护理。' },
    { title: '专科护理', description: '儿科、产科和精神科护理。' }
  ];
}

// Function to parse JSON from AI response
function parseJsonResponse(responseText: string): AIResponseData { 
  try {
    // Try direct parse first
    return JSON.parse(responseText) as AIResponseData;
  } catch (e) {
    console.log('初始解析失败，尝试清理字符串...');
    // Attempt to find JSON within ```json ... ``` block
    const startIdx = responseText.indexOf('```json');
    const endIdx = responseText.indexOf('```', startIdx + 7);
    if (startIdx !== -1 && endIdx !== -1) {
      const jsonText = responseText.substring(startIdx + 7, endIdx).trim();
      try {
        return JSON.parse(jsonText) as AIResponseData;
      } catch /* (e2) */ { /* Ignore inner error */ }
    }

    // Attempt to find JSON starting with { and ending with }
    const start = responseText.indexOf('{');
    const end = responseText.lastIndexOf('}');
    if (start !== -1 && end !== -1 && start < end) {
        let balance = 0;
        let valid = true;
        for(let i = start; i <= end; i++){
            if(responseText[i] === '{') balance++;
            if(responseText[i] === '}') balance--;
            if(balance < 0) { valid = false; break; }
        }
        if(valid && balance === 0){
             try {
                return JSON.parse(responseText.substring(start, end + 1)) as AIResponseData;
             } catch /* (e3) */ { /* Ignore inner error */ }
        }
    }
    
    throw new Error("无法从AI响应中提取有效的JSON: " + (e instanceof Error ? e.message : String(e)));
  }
} 