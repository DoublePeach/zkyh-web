/**
 * @description 基于数据库数据生成备考规划
 * @author 郝桃桃
 * @date 2024-08-05
 */

import { Pool } from 'pg';
import { SurveyFormData } from '@/types/survey';
import { OpenAI } from 'openai';
import { DB_CONFIG, AI_CONFIG } from '@/lib/config';

// 创建数据库连接池
const pool = new Pool({ connectionString: DB_CONFIG.PG_CONNECTION_STRING });

// 定义数据结构类型
interface ExamSubject {
  id: number;
  name: string;
  description: string;
  weight?: string;
}

interface NursingDiscipline {
  id: number;
  name: string;
  description: string;
}

interface Chapter {
  id: number;
  discipline_id: number;
  name: string;
  description: string;
  order_index: number;
  discipline_name?: string; // 附加字段，不在数据库中
}

interface TestBank {
  id: number;
  subject_id: number;
  name: string;
  description: string;
  type: string;
  year?: number;
  subject_name?: string; // 附加字段，不在数据库中
}

interface AIResponseData {
  overview: string;
  phases: {
    id: number;
    name: string;
    description: string;
    startDay: number;
    endDay: number;
    focusAreas: string[];
    learningGoals: string[];
    recommendedResources: string[];
  }[];
  dailyPlans: {
    day: number;
    date: string;
    phaseId: number;
    title: string;
    subjects: string[];
    tasks: {
      title: string;
      description: string;
      duration: number;
      resources: string[];
    }[];
    reviewTips: string;
  }[];
}

/**
 * @description 获取所有考试科目
 * @returns {Promise<ExamSubject[]>} 考试科目列表
 */
async function fetchExamSubjects(): Promise<ExamSubject[]> {
  try {
    const result = await pool.query(`
      SELECT id, name, description, weight 
      FROM exam_subjects 
      ORDER BY id
    `);
    return result.rows;
  } catch (error) {
    console.error('获取考试科目失败:', error);
    return [];
  }
}

/**
 * @description 获取所有护理学科
 * @returns {Promise<NursingDiscipline[]>} 护理学科列表
 */
async function fetchNursingDisciplines(): Promise<NursingDiscipline[]> {
  try {
    const result = await pool.query(`
      SELECT id, name, description 
      FROM nursing_disciplines 
      ORDER BY id
    `);
    return result.rows;
  } catch (error) {
    console.error('获取护理学科失败:', error);
    return [];
  }
}

/**
 * @description 获取特定护理学科的所有章节
 * @param {number} disciplineId - 护理学科ID
 * @returns {Promise<Chapter[]>} 章节列表
 */
async function fetchChaptersByDiscipline(disciplineId: number): Promise<Chapter[]> {
  try {
    const result = await pool.query(`
      SELECT c.id, c.discipline_id, c.name, c.description, c.order_index, nd.name as discipline_name
      FROM chapters c
      JOIN nursing_disciplines nd ON c.discipline_id = nd.id
      WHERE c.discipline_id = $1
      ORDER BY c.order_index
    `, [disciplineId]);
    return result.rows;
  } catch (error) {
    console.error(`获取护理学科(ID: ${disciplineId})的章节失败:`, error);
    return [];
  }
}

/**
 * @description 获取所有章节
 * @returns {Promise<Chapter[]>} 所有章节列表
 */
async function fetchAllChapters(): Promise<Chapter[]> {
  try {
    const result = await pool.query(`
      SELECT c.id, c.discipline_id, c.name, c.description, c.order_index, nd.name as discipline_name
      FROM chapters c
      JOIN nursing_disciplines nd ON c.discipline_id = nd.id
      ORDER BY c.discipline_id, c.order_index
    `);
    return result.rows;
  } catch (error) {
    console.error('获取所有章节失败:', error);
    return [];
  }
}

/**
 * @description 获取特定考试科目的题库
 * @param {number} subjectId - 考试科目ID
 * @returns {Promise<TestBank[]>} 题库列表
 */
async function fetchTestBanksBySubject(subjectId: number): Promise<TestBank[]> {
  try {
    const result = await pool.query(`
      SELECT tb.id, tb.subject_id, tb.name, tb.description, tb.type, tb.year, es.name as subject_name
      FROM test_banks tb
      JOIN exam_subjects es ON tb.subject_id = es.id
      WHERE tb.subject_id = $1
      ORDER BY tb.id
    `, [subjectId]);
    return result.rows;
  } catch (error) {
    console.error(`获取考试科目(ID: ${subjectId})的题库失败:`, error);
    return [];
  }
}

/**
 * @description 获取所有题库
 * @returns {Promise<TestBank[]>} 所有题库列表
 */
async function fetchAllTestBanks(): Promise<TestBank[]> {
  try {
    const result = await pool.query(`
      SELECT tb.id, tb.subject_id, tb.name, tb.description, tb.type, tb.year, es.name as subject_name
      FROM test_banks tb
      JOIN exam_subjects es ON tb.subject_id = es.id
      ORDER BY tb.subject_id, tb.id
    `);
    return result.rows;
  } catch (error) {
    console.error('获取所有题库失败:', error);
    return [];
  }
}

/**
 * @description 构建学习资料数据结构
 * @returns {Promise<any>} 包含所有学习资料的数据结构
 */
async function buildLearningMaterialsData(): Promise<any> {
  try {
    // 获取所有考试科目
    const examSubjects = await fetchExamSubjects();
    
    // 获取所有护理学科
    const nursingDisciplines = await fetchNursingDisciplines();
    
    // 获取所有章节
    const allChapters = await fetchAllChapters();
    
    // 获取所有题库
    const allTestBanks = await fetchAllTestBanks();
    
    // 为每个护理学科关联其章节
    const disciplinesWithChapters = nursingDisciplines.map(discipline => {
      const chapters = allChapters.filter(chapter => chapter.discipline_id === discipline.id);
      return {
        ...discipline,
        chapters
      };
    });
    
    // 为每个考试科目关联其题库
    const subjectsWithTestBanks = examSubjects.map(subject => {
      const testBanks = allTestBanks.filter(testBank => testBank.subject_id === subject.id);
      return {
        ...subject,
        testBanks
      };
    });
    
    // 将护理学科关联到相关的考试科目
    // 注意：这里假设护理学科名称与考试科目名称有一定的相关性
    // 如果数据库中没有明确的关联关系，这个映射可能需要手动维护
    const subjectsWithDisciplines = subjectsWithTestBanks.map(subject => {
      // 根据名称相似性关联护理学科
      const relatedDisciplines = disciplinesWithChapters.filter(discipline => 
        subject.name.includes(discipline.name) || 
        discipline.name.includes(subject.name) ||
        subject.description.includes(discipline.name) ||
        discipline.description.includes(subject.name)
      );
      
      return {
        ...subject,
        relatedDisciplines: relatedDisciplines.length > 0 ? relatedDisciplines : disciplinesWithChapters
      };
    });
    
    return {
      examSubjects: subjectsWithDisciplines,
      nursingDisciplines: disciplinesWithChapters
    };
  } catch (error) {
    console.error('构建学习资料数据结构失败:', error);
    return {
      examSubjects: [],
      nursingDisciplines: []
    };
  }
}

/**
 * @description 根据调查问卷数据和数据库学习资料生成备考规划
 * @param {SurveyFormData} surveyData - 调查问卷数据
 * @returns {Promise<AIResponseData>} AI生成的备考规划
 */
export async function generateStudyPlanFromDatabase(surveyData: SurveyFormData): Promise<AIResponseData> {
  try {
    // 获取职称级别
    let titleLevel = '';
    if (surveyData.titleLevel === 'junior') {
      titleLevel = '初级护师';
    } else if (surveyData.titleLevel === 'mid') {
      titleLevel = '主管护师';
    } else if (surveyData.titleLevel === 'other') {
      titleLevel = surveyData.otherTitleLevel || '其他职称';
    }
    
    // 计算距离考试的天数
    const examYear = parseInt(surveyData.examYear);
    const examDate = new Date(examYear, 3, 13); // 月份从0开始，所以4月是3
    const today = new Date();
    const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // 获取备考状态描述
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
    
    // 从数据库获取学习资料
    console.log('从数据库获取学习资料...');
    const learningMaterials = await buildLearningMaterialsData();
    console.log('成功获取学习资料:', 
      `考试科目数量: ${learningMaterials.examSubjects.length}, ` + 
      `护理学科数量: ${learningMaterials.nursingDisciplines.length}`
    );
    
    // 构建学习资料JSON字符串，以便包含在提示词中
    const learningMaterialsJSON = JSON.stringify(learningMaterials, null, 2);
    
    // 构建中文提示词
    const prompt = `你是一位专业的医卫职称备考规划专家，擅长为医疗从业人员制定个性化的备考计划。
    请根据以下用户信息以及数据库中的实际学习资料生成一个详细的备考规划，包括三个学习阶段和每日任务安排。

用户信息:
- 报考职称: ${titleLevel}
- 考试状态: ${examStatus}
- 学习基础: ${studyBaseDescription}
- 学习时间安排: 
  * 每周工作日学习: ${weekdaysCountDesc}
  * ${weekdayHoursDesc}
  * ${weekendHoursDesc}
- 距离考试还有${daysUntilExam}天，考试日期: ${examDate.toLocaleDateString('zh-CN')}

数据库中的学习资料:
${learningMaterialsJSON}

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
    
    console.log('开始调用AI生成备考规划...');
    const response = await openai.chat.completions.create({
      model: AI_CONFIG.DEFAULT_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    });
    
    console.log('AI返回结果...');
    
    // Check the expected structure of the API response
    if (!response.choices || !response.choices[0] || !response.choices[0].message || !response.choices[0].message.content) {
      console.error('OpenRouter API返回了不正确的数据格式，缺少必要字段');
      throw new Error('OpenRouter API返回了不正确的数据格式');
    }
    
    // Extract the content string which should contain our desired JSON
    const contentText = response.choices[0].message.content;
    console.log('内容文本长度:', contentText.length);
    console.log('内容预览:', contentText.substring(0, 200));
    
    // Now parse the contentText which should be the AIResponseData JSON
    try {
      console.log('正在解析AI返回的内容JSON...');
      const parsedResult = JSON.parse(contentText);
      
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
    } catch (parseError) {
      console.error('无法解析返回的内容JSON:', parseError);
      throw new Error('解析AI返回的JSON数据失败');
    }
  } catch (error) {
    console.error('基于数据库生成备考规划失败:', error);
    throw error;
  }
}

/**
 * @description 获取学习水平描述
 * @param {string} level - 水平值
 * @returns {string} 水平描述
 */
function getLevelDescription(level: string): string {
  const levelMap: Record<string, string> = {
    'weak': '基础薄弱，需要从头开始',
    'medium': '有一定基础，部分内容需要加强',
    'strong': '基础扎实，需要系统复习'
  };
  return levelMap[level] || '未知水平';
}

/**
 * @description 获取工作日学习天数描述
 * @param {string} count - 天数值
 * @returns {string} 天数描述
 */
function getWeekdaysCountDescription(count: string): string {
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
function getHoursDescription(hours: string, dayType: string): string {
  const hoursMap: Record<string, string> = {
    '1-2': `${dayType}每天1-2小时`,
    '3-4': `${dayType}每天3-4小时`,
    '5-6': `${dayType}每天5-6小时`,
    '6+': `${dayType}每天6小时以上`
  };
  return hoursMap[hours] || `${dayType}未知时长`;
} 