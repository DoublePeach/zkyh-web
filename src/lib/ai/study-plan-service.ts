/**
 * @description 备考规划生成服务 - 主入口
 * @author 郝桃桃
 * @date 2024-09-29
 */
import { SurveyFormData } from '@/types/survey';
import { AIResponseData, callAIAPI } from './api-client';
import { generateBasicPrompt, generateDatabasePrompt } from './templates/study-plan-prompt';
import { generateLocalStudyPlan } from './fallback-generator';
import * as directDb from '@/lib/direct-db';
import * as fs from 'fs/promises';
import path from 'path';

// 最大每日规划生成天数（用于长期规划）
const MAX_DAILY_PLAN_DAYS = 30;

// 提示词和响应保存的目录
const TIPS_DIR = path.resolve(process.cwd(), 'preparation-plan-tips');

/**
 * @description 保存文本到文件
 * @param {string} filename - 文件名
 * @param {string} content - 文件内容
 * @returns {Promise<string>} - 保存的文件路径
 */
async function saveToFile(filename: string, content: string): Promise<string> {
  try {
    // 确保目录存在
    await fs.mkdir(TIPS_DIR, { recursive: true });
    
    // 生成完整的文件路径
    const filePath = path.join(TIPS_DIR, filename);
    
    // 写入文件
    await fs.writeFile(filePath, content, 'utf8');
    
    console.log(`成功保存文件到: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('保存文件失败:', error);
    return '';
  }
}

interface LearningMaterial {
  examSubjects: any[];
  nursingDisciplines: any[];
  knowledgePoints?: any[];
  testBanks?: any[];
}

/**
 * @description 从数据库获取学习资料并生成备考规划
 * @param {SurveyFormData} surveyData - 用户调查问卷数据
 * @returns {Promise<AIResponseData>} - AI生成的备考规划
 */
export async function generateStudyPlanFromDatabase(surveyData: SurveyFormData): Promise<AIResponseData> {
  try {
    console.log('===== 备考规划生成过程详细日志 =====');
    console.log('时间:', new Date().toISOString());
    console.log('用户数据:', JSON.stringify(surveyData, null, 2));
    console.log('开始生成备考规划...');
    
    // 计算考试基本信息
    const examYear = parseInt(surveyData.examYear);
    const examDate = new Date(examYear, 3, 13); // 月份从0开始，所以4月是3
    const today = new Date();
    const daysUntilExam = Math.max(1, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    
    // 确定是否需要限制每日规划的生成天数
    const isLongTermPlan = daysUntilExam > MAX_DAILY_PLAN_DAYS;
    const planGenerationDays = isLongTermPlan ? MAX_DAILY_PLAN_DAYS : daysUntilExam;
    
    console.log(`距离考试还有${daysUntilExam}天，${isLongTermPlan ? `将只生成近${MAX_DAILY_PLAN_DAYS}天的详细规划` : '将生成完整的每日规划'}`);
    
    let learningMaterials = null;
    
    try {
      // 从数据库获取学习资料
      console.log('从数据库获取学习资料...');
      learningMaterials = await buildLearningMaterialsData(surveyData);
      console.log('成功获取学习资料:', 
        `考试科目数量: ${learningMaterials.examSubjects.length}, ` + 
        `护理学科数量: ${learningMaterials.nursingDisciplines.length}`
      );
      
      // 记录学习资料的更详细信息
      console.log('知识点数量:', learningMaterials.knowledgePoints?.length || 0);
      console.log('题库数量:', learningMaterials.testBanks?.length || 0);
    } catch (dbError) {
      // 数据库错误不影响整体流程，记录错误并继续
      console.error('获取学习资料失败，继续使用基础提示词:', dbError);
    }
    
    // 尝试调用AI API生成规划
    console.log('调用AI服务生成备考规划...');
    
    // 构建提示词
    const prompt = learningMaterials ? 
      generateDatabasePrompt(surveyData, daysUntilExam, examDate, isLongTermPlan, planGenerationDays, learningMaterials) :
      generateBasicPrompt(surveyData, daysUntilExam, examDate);
    
    // 生成唯一的文件名
    const timestamp = Date.now();
    const promptFilename = `prompt_${timestamp}.txt`;
    
    // 异步保存提示词到文件
    const savePromptPromise = saveToFile(promptFilename, prompt);
    
    try {
      // 记录提示词长度
      console.log(`提示词已生成，长度: ${prompt.length} 字符`);
      
      // 调用AI API
      const result = await callAIAPI(prompt);
      console.log('成功从API获取响应');
      
      // 等待提示词保存完成
      await savePromptPromise;
      
      // 保存API响应到文件
      const responseFilename = `response_${timestamp}.json`;
      try {
        const responseJson = JSON.stringify(result, null, 2);
        await saveToFile(responseFilename, responseJson);
      } catch (saveError) {
        console.error('保存API响应到文件失败:', saveError);
      }
      
      console.log('成功生成备考规划');
      return result;
    } catch (apiError) {
      // API调用失败，记录错误并使用本地生成
      console.error('AI服务调用失败:', apiError);
      console.log('使用本地备选方案...');
      
      // 等待提示词保存完成
      await savePromptPromise;
      
      // 保存错误信息到文件
      const errorFilename = `error_${timestamp}.txt`;
      try {
        await saveToFile(errorFilename, `API调用失败: ${apiError}\n\n原始提示词:\n${prompt}`);
      } catch (saveError) {
        console.error('保存错误信息到文件失败:', saveError);
      }
      
      const localPlan = generateLocalStudyPlan(surveyData, learningMaterials, daysUntilExam);
      
      // 保存本地生成的规划到文件
      const localPlanFilename = `local_plan_${timestamp}.json`;
      try {
        const localPlanJson = JSON.stringify(localPlan, null, 2);
        await saveToFile(localPlanFilename, localPlanJson);
      } catch (saveError) {
        console.error('保存本地生成的规划到文件失败:', saveError);
      }
      
      console.log('本地备选方案生成成功');
      return localPlan;
    }
  } catch (error) {
    // 捕获所有可能的错误
    console.error('生成备考规划过程中发生错误:', error);
    
    // 保存错误信息到文件
    const errorFilename = `critical_error_${Date.now()}.txt`;
    try {
      await saveToFile(errorFilename, `生成规划过程中发生关键错误: ${error instanceof Error ? error.message : String(error)}`);
    } catch (saveError) {
      console.error('保存关键错误信息到文件失败:', saveError);
    }
    
    // 使用本地备选方案
    console.log('使用本地生成方案创建备考规划...');
    const backupPlan = generateLocalStudyPlan(surveyData, null, 90); // 默认90天
    return backupPlan;
  }
}

/**
 * @description 从数据库构建学习资料数据
 * @param {SurveyFormData} surveyData - 用户表单数据
 * @returns {Promise<LearningMaterial>} 学习资料数据
 */
async function buildLearningMaterialsData(surveyData: SurveyFormData): Promise<LearningMaterial> {
  try {
    // 获取考试科目
    const examSubjects = await fetchExamSubjects();
    
    // 获取护理学科 - 优先获取基础护理学(ID=4)
    const nursingDisciplines = await fetchNursingDisciplines();
    
    // 获取知识点 - 优先获取与专业实践能力(ID=4)和基础护理学相关的知识点
    const knowledgePoints = await fetchKnowledgePoints();
    
    // 获取题库 - 优先获取专业实践能力科目(ID=4)的题库
    const testBanks = await fetchTestBanks();
    
    // 构建学科与章节关系 - 优先处理基础护理学
    console.log('开始构建学科与章节关系');
    const nursingDisciplinesWithChapters = await Promise.all(
      nursingDisciplines.map(async (discipline) => {
        const chapters = await fetchChaptersByDiscipline(discipline.id);
        return {
          ...discipline,
          chapters
        };
      })
    );
    
    // 按照科目ID排序，使专业实践能力(ID=4)排前面
    const sortedExamSubjects = [...examSubjects].sort((a, b) => {
      // ID为4的排最前面
      if (a.id === 4) return -1;
      if (b.id === 4) return 1;
      return a.id - b.id;
    });
    
    // 按照学科ID排序，使基础护理学(ID=4)排前面
    const sortedNursingDisciplines = [...nursingDisciplinesWithChapters].sort((a, b) => {
      // ID为4的排最前面
      if (a.id === 4) return -1;
      if (b.id === 4) return 1;
      return a.id - b.id;
    });
    
    // 返回完整的学习资料结构
    return {
      examSubjects: sortedExamSubjects,
      nursingDisciplines: sortedNursingDisciplines,
      knowledgePoints,
      testBanks
    };
  } catch (error) {
    console.error('构建学习资料数据失败:', error);
    throw error;
  }
}

/**
 * @description 获取所有考试科目
 * @returns {Promise<any[]>} 考试科目列表
 */
async function fetchExamSubjects(): Promise<any[]> {
  try {
    const result = await directDb.executeQuery(`
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
 * @returns {Promise<any[]>} 护理学科列表
 */
async function fetchNursingDisciplines(): Promise<any[]> {
  try {
    const result = await directDb.executeQuery(`
      SELECT id, name, description
      FROM nursing_disciplines
      ORDER BY 
        CASE WHEN id = 4 THEN 0 ELSE id END  -- 基础护理学(ID=4)排在最前面
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
 * @returns {Promise<any[]>} 章节列表
 */
async function fetchChaptersByDiscipline(disciplineId: number): Promise<any[]> {
  try {
    // 提高基础护理学章节的查询优先级
    const priority = disciplineId === 4 ? 'HIGH' : 'NORMAL';
    console.log(`获取护理学科(ID: ${disciplineId})的章节，优先级: ${priority}`);
    
    const result = await directDb.executeQuery(`
      SELECT c.id, c.discipline_id, c.name, c.description, c.order_index
      FROM chapters c
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
 * @description 获取所有知识点，优先获取专业实践能力和基础护理学相关的知识点
 * @returns {Promise<any[]>} 所有知识点列表
 */
async function fetchKnowledgePoints(): Promise<any[]> {
  try {
    // 优先获取专业实践能力(ID=4)相关的知识点
    const result = await directDb.executeQuery(`
      SELECT kp.id, kp.subject_id, kp.chapter_id, kp.title, kp.content,
             c.name as chapter_name, es.name as subject_name,
             c.discipline_id
      FROM knowledge_points kp
      LEFT JOIN chapters c ON kp.chapter_id = c.id
      LEFT JOIN exam_subjects es ON kp.subject_id = es.id
      ORDER BY 
        CASE WHEN kp.subject_id = 4 THEN 0 ELSE kp.subject_id END,  -- 专业实践能力科目(ID=4)排在最前面
        CASE WHEN c.discipline_id = 4 THEN 0 ELSE c.discipline_id END,  -- 基础护理学(ID=4)排在最前面
        kp.id
      LIMIT 150  -- 增加获取的知识点数量，确保获取足够的基础护理学知识点
    `);
    return result.rows;
  } catch (error) {
    console.error('获取知识点失败:', error);
    return [];
  }
}

/**
 * @description 获取所有题库，优先获取专业实践能力科目的题库
 * @returns {Promise<any[]>} 所有题库列表
 */
async function fetchTestBanks(): Promise<any[]> {
  try {
    const result = await directDb.executeQuery(`
      SELECT tb.id, tb.subject_id, tb.name, tb.description, tb.type, tb.year,
             es.name as subject_name
      FROM test_banks tb
      JOIN exam_subjects es ON tb.subject_id = es.id
      ORDER BY 
        CASE WHEN tb.subject_id = 4 THEN 0 ELSE tb.subject_id END,  -- 专业实践能力科目(ID=4)排在最前面
        tb.id
    `);
    return result.rows;
  } catch (error) {
    console.error('获取题库失败:', error);
    return [];
  }
}

/**
 * @description 生成基于OpenAI的备考规划（不使用数据库，适用于测试环境）
 * @param {SurveyFormData} surveyData - 用户调查问卷数据
 * @returns {Promise<AIResponseData>} - AI生成的备考规划
 */
export async function generateBasicStudyPlan(surveyData: SurveyFormData): Promise<AIResponseData> {
  try {
    console.log('===== 生成基础版备考规划 =====');
    console.log('时间:', new Date().toISOString());
    console.log('用户数据:', JSON.stringify(surveyData, null, 2));
    
    // 计算考试基本信息
    const examYear = parseInt(surveyData.examYear);
    const examDate = new Date(examYear, 3, 13); // 月份从0开始，所以4月是3
    const today = new Date();
    const daysUntilExam = Math.max(1, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    
    console.log(`距离考试还有${daysUntilExam}天`);
    
    // 生成基础提示词
    const prompt = generateBasicPrompt(surveyData, daysUntilExam, examDate);
    
    // 生成唯一的文件名
    const timestamp = Date.now();
    const promptFilename = `basic_prompt_${timestamp}.txt`;
    
    // 异步保存提示词到文件
    const savePromptPromise = saveToFile(promptFilename, prompt);
    
    // 调用AI服务
    try {
      // 记录提示词长度
      console.log(`基础提示词已生成，长度: ${prompt.length} 字符`);
      
      console.log('开始调用AI API生成基础备考规划...');
      const result = await callAIAPI(prompt);
      console.log('成功从API获取基础备考规划响应');
      
      // 等待提示词保存完成
      await savePromptPromise;
      
      // 保存API响应到文件
      const responseFilename = `basic_response_${timestamp}.json`;
      try {
        const responseJson = JSON.stringify(result, null, 2);
        await saveToFile(responseFilename, responseJson);
      } catch (saveError) {
        console.error('保存基础规划API响应到文件失败:', saveError);
      }
      
      console.log('成功生成基础备考规划');
      return result;
    } catch (apiError) {
      console.error('AI服务调用失败:', apiError);
      console.log('使用本地备选方案...');
      
      // 等待提示词保存完成
      await savePromptPromise;
      
      // 保存错误信息到文件
      const errorFilename = `basic_error_${timestamp}.txt`;
      try {
        await saveToFile(errorFilename, `基础规划API调用失败: ${apiError}\n\n原始提示词:\n${prompt}`);
      } catch (saveError) {
        console.error('保存错误信息到文件失败:', saveError);
      }
      
      const localPlan = generateLocalStudyPlan(surveyData, null, daysUntilExam);
      
      // 保存本地生成的规划到文件
      const localPlanFilename = `basic_local_plan_${timestamp}.json`;
      try {
        const localPlanJson = JSON.stringify(localPlan, null, 2);
        await saveToFile(localPlanFilename, localPlanJson);
      } catch (saveError) {
        console.error('保存本地生成的规划到文件失败:', saveError);
      }
      
      return localPlan;
    }
  } catch (error) {
    console.error('生成基础备考规划失败:', error);
    
    // 保存错误信息到文件
    const errorFilename = `basic_critical_error_${Date.now()}.txt`;
    try {
      await saveToFile(errorFilename, `生成基础规划过程中发生关键错误: ${error instanceof Error ? error.message : String(error)}`);
    } catch (saveError) {
      console.error('保存关键错误信息到文件失败:', saveError);
    }
    
    // 最终备用方案：本地生成
    return generateLocalStudyPlan(surveyData, null, 90); // 默认90天
  }
} 