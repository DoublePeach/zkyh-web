/**
 * @description OpenRouter API服务，用于AI模型调用
 * @author 郝桃桃
 * @date 2023-10-01
 */

import { SurveyFormData } from '@/types/survey';
import { AI_CONFIG } from '@/lib/config';

// Define a more specific type for the AI response structure if possible
interface AIResponseData {
    overview: string;
    phases: Array<{
        id: number;
        name: string;
        description: string;
        startDay: number;
        endDay: number;
        focusAreas: string[];
        learningGoals: string[];
        recommendedResources: string[];
    }>;
    dailyPlans: Array<{
        day: number;
        date: string;
        phaseId: number;
        title: string;
        subjects: string[];
        tasks: Array<{
            title: string;
            description: string;
            duration: number;
            resources: string[];
        }>;
        reviewTips: string;
    }>;
}

// 应用信息
// const APP_URL = 'https://medical-cert-exam-prep.vercel.app';
const APP_URL = 'http://localhost:3000';
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
    const prompt = `你是一位专业的医卫职称备考规划专家，擅长为医疗从业人员制定个性化的备考计划。
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
    const response = await fetchWithRetry(AI_CONFIG.OPENROUTER_BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${AI_CONFIG.OPENROUTER_API_KEY}`,
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
      console.log('正在解析完整的API响应...');
      apiResponseData = JSON.parse(responseText); 
      console.log('API响应解析成功，包含', apiResponseData.choices?.length || 0, '个结果');
    } catch (error: unknown) {
      console.error('无法解析API响应JSON:', error);
      console.log('API响应内容预览:', responseText.substring(0, 200));
      throw new Error(`AI 请求失败: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Check the expected structure of the API response
    if (!apiResponseData.choices || !apiResponseData.choices[0] || !apiResponseData.choices[0].message || !apiResponseData.choices[0].message.content) {
      console.error('OpenRouter API返回了不正确的数据格式，缺少必要字段');
      console.log('API响应结构:', JSON.stringify(apiResponseData).substring(0, 300));
      throw new Error('OpenRouter API返回了不正确的数据格式');
    }
    
    // Extract the *content* string which should contain our desired JSON
    const contentText = apiResponseData.choices[0].message.content;
    console.log('内容文本长度:', contentText.length);
    console.log('内容预览:', contentText.substring(0, 200));
    
    // Now parse the contentText which should be the AIResponseData JSON
    try {
      console.log('正在解析AI返回的内容JSON...');
      const parsedResult = parseJsonResponse(contentText); // Parse the actual content
      
      // 验证解析出的数据结构是否符合预期
      console.log('JSON解析成功，验证数据结构...');
      const overview = parsedResult.overview;
      console.log('overview有效性:', !!overview);
      
      const phases = parsedResult.phases;
      console.log('phases数组长度:', phases?.length || 0);
      if (phases && phases.length > 0) {
        console.log('第一阶段名称:', phases[0].name);
      }
      
      const dailyPlans = parsedResult.dailyPlans;
      console.log('dailyPlans数组长度:', dailyPlans?.length || 0);
      if (dailyPlans && dailyPlans.length > 0) {
        console.log('第一天任务数量:', dailyPlans[0].tasks?.length || 0);
      }
      
      console.log('AI返回数据解析完成，已验证数据结构完整性');
      return parsedResult;
    } catch (parseError: unknown) {
      console.error('无法解析返回的内容JSON:', parseError);
      console.log('尝试使用备用方案...');
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
  
  // 计算三个阶段的天数
  const phase1Days = Math.floor(daysUntilExam * 0.4); // 基础阶段40%
  const phase2Days = Math.floor(daysUntilExam * 0.3); // 强化阶段30%
  const phase3Days = daysUntilExam - phase1Days - phase2Days; // 冲刺阶段剩余天数
  
  // 创建三个阶段
  const phases = [
    {
      id: 1,
      name: "基础学习阶段",
      description: `为期${phase1Days}天的基础知识学习，帮助你掌握备考${titleLevel}的核心概念和基本理论。`,
      startDay: 1,
      endDay: phase1Days,
      focusAreas: ["护理学基础知识", "解剖生理学", "基础药理学"],
      learningGoals: ["掌握核心理论知识", "熟悉基础概念", "建立知识框架"],
      recommendedResources: ["《护理学基础》教材", "《人体解剖学》教材", "护理基础知识在线课程"]
    },
    {
      id: 2,
      name: "重点强化阶段",
      description: `为期${phase2Days}天的重点内容强化学习，针对${titleLevel}考试的关键考点和难点进行强化复习。`,
      startDay: phase1Days + 1,
      endDay: phase1Days + phase2Days,
      focusAreas: ["专科护理知识", "护理操作技能", "常见疾病护理"],
      learningGoals: ["掌握专业技能要点", "熟悉重点难点", "提高应用能力"],
      recommendedResources: ["《内外科护理学》教材", "《专科护理》教材", "历年考试真题"]
    },
    {
      id: 3,
      name: "模拟冲刺阶段",
      description: `为期${phase3Days}天的考前冲刺复习，通过模拟测试和综合复习巩固知识点，提高应试能力。`,
      startDay: phase1Days + phase2Days + 1,
      endDay: daysUntilExam,
      focusAreas: ["综合复习", "模拟考试", "答题技巧"],
      learningGoals: ["查漏补缺", "提高应试能力", "心理调适"],
      recommendedResources: ["模拟试卷", "考前重点总结", "答题技巧指导"]
    }
  ];
  
  // 创建每日计划
  const dailyPlans = [];
  const topicsByPhase = {
    1: getNursingModules().slice(0, 2), // 基础阶段模块
    2: getNursingModules().slice(2, 4), // 强化阶段模块
    3: getNursingModules().slice(4)     // 冲刺阶段模块
  };
  
  // 生成今天的日期
  const today = new Date();
  
  // 为每一天创建学习计划
  for (let day = 1; day <= daysUntilExam; day++) {
    // 确定当前日期
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + day - 1);
    const dateString = currentDate.toISOString().split('T')[0]; // 格式：YYYY-MM-DD
    
    // 确定当前阶段
    let currentPhase = 1;
    if (day > phase1Days) {
      currentPhase = day > (phase1Days + phase2Days) ? 3 : 2;
    }
    
    // 从当前阶段的主题中选择
    const phaseTopics = topicsByPhase[currentPhase as keyof typeof topicsByPhase];
    const topicIndex = (day - 1) % phaseTopics.length;
    const dailyTopic = phaseTopics[topicIndex];
    
    // 创建1-3个任务
    const tasksCount = Math.min(3, 1 + Math.floor(Math.random() * 3));
    const tasks = [];
    
    for (let i = 0; i < tasksCount; i++) {
      tasks.push({
        title: `${dailyTopic.title} - 任务 ${i + 1}`,
        description: `学习${dailyTopic.title}的基础知识和关键概念。`,
        duration: 30 + Math.floor(Math.random() * 60), // 30-90分钟
        resources: [`《${dailyTopic.title}》参考资料`, "在线学习资源"]
      });
    }
    
    // 添加当天计划
    dailyPlans.push({
      day,
      date: dateString,
      phaseId: currentPhase,
      title: `第${day}天 - ${dailyTopic.title}学习`,
      subjects: [dailyTopic.title],
      tasks,
      reviewTips: `复习今天学习的${dailyTopic.title}要点，完成相关练习题。`
    });
  }
  
  return {
    overview: `这是一个为期${daysUntilExam}天的护理专业人员准备${titleLevel}认证的学习计划。分为基础学习、重点强化和模拟冲刺三个阶段，通过系统化学习和复习，帮助你全面备考。`,
    phases,
    dailyPlans
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
    console.log('尝试直接解析JSON...');
    return JSON.parse(responseText) as AIResponseData;
  } catch (e) {
    console.log('初始解析失败，尝试清理字符串后重新解析...');
    // Attempt to find JSON within ```json ... ``` block
    const startIdx = responseText.indexOf('```json');
    const endIdx = responseText.indexOf('```', startIdx + 7);
    if (startIdx !== -1 && endIdx !== -1) {
      console.log(`找到代码块标记，从位置${startIdx+7}到${endIdx}提取JSON`);
      const jsonText = responseText.substring(startIdx + 7, endIdx).trim();
      try {
        const result = JSON.parse(jsonText) as AIResponseData;
        console.log('代码块中的JSON解析成功');
        return result;
      } catch (e2) { 
        console.error('无法解析代码块中的JSON:', e2);
      }
    }

    // Attempt to find JSON starting with { and ending with }
    const start = responseText.indexOf('{');
    const end = responseText.lastIndexOf('}');
    if (start !== -1 && end !== -1 && start < end) {
        console.log(`尝试从位置${start}到${end}提取JSON对象`);
        let balance = 0;
        let valid = true;
        for(let i = start; i <= end; i++){
            if(responseText[i] === '{') balance++;
            if(responseText[i] === '}') balance--;
            if(balance < 0) { 
                valid = false; 
                console.log(`在位置${i}处JSON结构不平衡`);
                break; 
            }
        }
        if(valid && balance === 0){
             try {
                const result = JSON.parse(responseText.substring(start, end + 1)) as AIResponseData;
                console.log('成功从文本中提取并解析JSON');
                return result;
             } catch (e3) { 
                console.error('从文本中提取的JSON解析失败:', e3);
             }
        } else {
            console.log('提取的文本不是有效的JSON结构');
        }
    }
    
    throw new Error("无法从AI响应中提取有效的JSON: " + (e instanceof Error ? e.message : String(e)));
  }
} 