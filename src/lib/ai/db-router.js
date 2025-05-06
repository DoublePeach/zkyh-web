/**
 * @description 数据库与AI模型连接服务，基于PostgreSQL MCP Server (ESM版本)
 * @author 郝桃桃
 * @date 2024-08-05
 */

import { OpenAI } from 'openai';
import { DB_CONFIG, AI_CONFIG } from '../config.js';

// 定义数据结构类型
/**
 * @typedef {Object} ExamSubject
 * @property {string} id - 学科ID
 * @property {string} name - 学科名称
 * @property {string} description - 学科描述
 */

/**
 * @typedef {Object} Chapter
 * @property {string} id - 章节ID
 * @property {string} name - 章节名称
 * @property {string} content - 章节内容
 * @property {string} exam_subject_id - 学科ID
 */

/**
 * @typedef {Object} AIResponseData
 * @property {string} overview - 整体概述
 * @property {Array<{id: number, name: string, description: string, startDay: number, endDay: number, focusAreas: string[], learningGoals: string[], recommendedResources: string[]}>} phases - 学习阶段
 * @property {Array<{day: number, date: string, phaseId: number, title: string, subjects: string[], tasks: Array<{title: string, description: string, duration: number, resources: string[]}>, reviewTips: string}>} dailyPlans - 每日计划
 */

/**
 * @description 从数据库获取考试学科列表
 * @returns {Promise<ExamSubject[]>} 考试学科列表
 */
async function fetchExamSubjects() {
  try {
    // 使用OpenAI调用PostgreSQL MCP Server
    const openai = new OpenAI({
      apiKey: AI_CONFIG.OPENROUTER_API_KEY,
      baseURL: AI_CONFIG.OPENROUTER_BASE_URL
    });
    
    // 准备查询语句
    const sqlQuery = 'SELECT id, name, description FROM exam_subjects ORDER BY id';
    
    // 执行查询
    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.DEFAULT_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `连接到PostgreSQL数据库并执行以下查询：${sqlQuery}。连接信息：${DB_CONFIG.PG_CONNECTION_STRING}`
            }
          ]
        }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'query',
            description: 'Execute a SQL query against the PostgreSQL database.',
            parameters: {
              type: 'object',
              properties: {
                sql: {
                  type: 'string',
                  description: 'The SQL query to execute'
                }
              },
              required: ['sql']
            }
          }
        }
      ]
    });
    
    // 处理结果
    const result = completion.choices[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (result) {
      const resultObj = JSON.parse(result);
      return resultObj.rows || [];
    }
    
    return [];
  } catch (error) {
    console.error('获取考试学科失败:', error);
    return [];
  }
}

/**
 * @description 从数据库获取章节列表
 * @param {string} examSubjectId - 考试学科ID
 * @returns {Promise<Chapter[]>} 章节列表
 */
async function fetchChapters(examSubjectId) {
  try {
    // 使用OpenAI调用PostgreSQL MCP Server
    const openai = new OpenAI({
      apiKey: AI_CONFIG.OPENROUTER_API_KEY,
      baseURL: AI_CONFIG.OPENROUTER_BASE_URL
    });
    
    // 准备查询语句
    const sqlQuery = `SELECT id, name, content, exam_subject_id FROM chapters WHERE exam_subject_id = '${examSubjectId}' ORDER BY id`;
    
    // 执行查询
    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.DEFAULT_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `连接到PostgreSQL数据库并执行以下查询：${sqlQuery}。连接信息：${DB_CONFIG.PG_CONNECTION_STRING}`
            }
          ]
        }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'query',
            description: 'Execute a SQL query against the PostgreSQL database.',
            parameters: {
              type: 'object',
              properties: {
                sql: {
                  type: 'string',
                  description: 'The SQL query to execute'
                }
              },
              required: ['sql']
            }
          }
        }
      ]
    });
    
    // 处理结果
    const result = completion.choices[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (result) {
      const resultObj = JSON.parse(result);
      return resultObj.rows || [];
    }
    
    return [];
  } catch (error) {
    console.error(`获取章节失败(学科ID: ${examSubjectId}):`, error);
    return [];
  }
}

/**
 * @description 基于数据库数据生成备考规划
 * @param {Object} surveyData - 用户调查问卷数据
 * @returns {Promise<AIResponseData>} - AI生成的备考规划
 */
export async function generateStudyPlanFromDatabase(surveyData) {
  try {
    console.log('开始从数据库生成备考方案...');
    
    // 获取考试基本信息
    const examYear = parseInt(surveyData.examYear);
    const examDate = new Date(examYear, 3, 13); // 月份从0开始，所以4月是3
    const today = new Date();
    const daysUntilExam = Math.max(1, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    
    // 获取职称级别
    const titleLevel = surveyData.titleLevel === 'junior' ? '初级护师' : 
                     surveyData.titleLevel === 'mid' ? '主管护师' : 
                     surveyData.otherTitleLevel;
    
    // 从数据库获取考试学科
    const examSubjects = await fetchExamSubjects();
    console.log(`从数据库获取到 ${examSubjects.length} 个考试学科`);
    
    // 为每个学科获取相关章节
    const subjectsWithChapters = await Promise.all(
      examSubjects.map(async (subject) => {
        const chapters = await fetchChapters(subject.id);
        return {
          ...subject,
          chapters
        };
      })
    );
    
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
    
    // 准备数据库学习资料的JSON结构
    const learningMaterialsData = JSON.stringify(subjectsWithChapters);
    
    // 构建带有数据库学习资料的中文提示词
    const prompt = `你是一位专业的医卫职称备考规划专家，擅长为医疗从业人员制定个性化的备考计划。
    请根据以下用户信息和数据库中的学习资料生成一个详细的备考规划，包括三个学习阶段和每日任务安排。

用户信息:
- 报考职称: ${titleLevel}
- 考试状态: ${examStatus}
- 学习基础: ${studyBaseDescription}
- 学习时间安排: 
  * 每周工作日学习: ${weekdaysCountDesc}
  * ${weekdayHoursDesc}
  * ${weekendHoursDesc}
- 距离考试还有${daysUntilExam}天，考试日期: ${examDate.toLocaleDateString('zh-CN')}

数据库学习资料:
${learningMaterialsData}

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
4. 学习资源必须来自数据库中提供的学习资料，使用真实的学科名称和章节名称
5. 确保所有推荐的学习内容都是从数据库中实际提供的资料中选择的

请确保返回的JSON格式正确，便于系统解析。请不要在JSON前后添加任何额外的说明或描述。`;

    // 使用OpenAI生成带有数据库学习资料的备考规划
    const openai = new OpenAI({
      apiKey: AI_CONFIG.OPENROUTER_API_KEY,
      baseURL: AI_CONFIG.OPENROUTER_BASE_URL
    });
    
    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.DEFAULT_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    });
    
    // 处理响应
    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('AI模型没有返回有效内容');
    }
    
    console.log('AI返回数据解析完成，已验证数据结构完整性');
    return JSON.parse(responseContent);
  } catch (error) {
    console.error('基于数据库生成备考方案失败:', error);
    throw new Error(`生成备考方案失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * @description 获取学习基础水平描述
 */
function getLevelDescription(level) {
  const map = {
    'low': '了解较少（★）',
    'medium': '一般了解（★★）',
    'high': '熟悉掌握（★★★）'
  };
  return map[level] || '未知水平';
}

/**
 * @description 获取工作日学习天数描述
 */
function getWeekdaysCountDescription(count) {
  const map = {
    '1-2': '每周1-2天',
    '3-4': '每周3-4天',
    '5': '每个工作日（每周5天）'
  };
  return map[count] || '未指定天数';
}

/**
 * @description 获取学习时间描述
 */
function getHoursDescription(hours, type) {
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