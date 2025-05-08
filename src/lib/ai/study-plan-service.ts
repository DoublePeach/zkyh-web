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

// 最大每日规划生成天数（用于长期规划）
const MAX_DAILY_PLAN_DAYS = 30;

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
    
    try {
      // 调用AI API
      const result = await callAIAPI(prompt);
      console.log('成功生成备考规划');
      return result;
    } catch (apiError) {
      // API调用失败，记录错误并使用本地生成
      console.error('AI服务调用失败:', apiError);
      console.log('使用本地备选方案...');
      const localPlan = generateLocalStudyPlan(surveyData, learningMaterials, daysUntilExam);
      console.log('本地备选方案生成成功');
      return localPlan;
    }
  } catch (error) {
    // 捕获所有可能的错误
    console.error('生成备考规划过程中发生错误:', error);
    
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
    
    // 获取护理学科
    const nursingDisciplines = await fetchNursingDisciplines();
    
    // 获取知识点
    const knowledgePoints = await fetchKnowledgePoints();
    
    // 获取题库
    const testBanks = await fetchTestBanks();
    
    // 构建学科与章节关系
    const nursingDisciplinesWithChapters = await Promise.all(
      nursingDisciplines.map(async (discipline) => {
        const chapters = await fetchChaptersByDiscipline(discipline.id);
        return {
          ...discipline,
          chapters
        };
      })
    );
    
    // 返回完整的学习资料结构
    return {
      examSubjects,
      nursingDisciplines: nursingDisciplinesWithChapters,
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
 * @returns {Promise<any[]>} 章节列表
 */
async function fetchChaptersByDiscipline(disciplineId: number): Promise<any[]> {
  try {
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
 * @description 获取所有知识点
 * @returns {Promise<any[]>} 所有知识点列表
 */
async function fetchKnowledgePoints(): Promise<any[]> {
  try {
    const result = await directDb.executeQuery(`
      SELECT kp.id, kp.subject_id, kp.chapter_id, kp.title, kp.content,
             c.name as chapter_name, es.name as subject_name
      FROM knowledge_points kp
      LEFT JOIN chapters c ON kp.chapter_id = c.id
      LEFT JOIN exam_subjects es ON kp.subject_id = es.id
      ORDER BY kp.subject_id, kp.chapter_id, kp.id
      LIMIT 100
    `);
    return result.rows;
  } catch (error) {
    console.error('获取知识点失败:', error);
    return [];
  }
}

/**
 * @description 获取所有题库
 * @returns {Promise<any[]>} 所有题库列表
 */
async function fetchTestBanks(): Promise<any[]> {
  try {
    const result = await directDb.executeQuery(`
      SELECT tb.id, tb.subject_id, tb.name, tb.description, tb.type, tb.year,
             es.name as subject_name
      FROM test_banks tb
      JOIN exam_subjects es ON tb.subject_id = es.id
      ORDER BY tb.subject_id, tb.id
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
    // 计算考试基本信息
    const examYear = parseInt(surveyData.examYear);
    const examDate = new Date(examYear, 3, 13); // 月份从0开始，所以4月是3
    const today = new Date();
    const daysUntilExam = Math.max(1, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    
    console.log(`距离考试还有${daysUntilExam}天`);
    
    // 生成基础提示词
    const prompt = generateBasicPrompt(surveyData, daysUntilExam, examDate);
    
    // 调用AI服务
    try {
      const result = await callAIAPI(prompt);
      console.log('成功生成基础备考规划');
      return result;
    } catch (apiError) {
      console.error('AI服务调用失败:', apiError);
      console.log('使用本地备选方案...');
      return generateLocalStudyPlan(surveyData, null, daysUntilExam);
    }
  } catch (error) {
    console.error('生成基础备考规划失败:', error);
    
    // 最终备用方案：本地生成
    return generateLocalStudyPlan(surveyData, null, 90); // 默认90天
  }
} 