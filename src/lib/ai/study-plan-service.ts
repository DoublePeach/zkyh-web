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
    
    // 检查内容大小
    const contentSizeInMB = Buffer.byteLength(content, 'utf8') / (1024 * 1024);
    console.log(`保存文件 ${filename}, 内容大小: ${contentSizeInMB.toFixed(2)} MB`);
    
    // 写入文件 - 使用writeFile代替，增加配置项以处理大文件
    await fs.writeFile(filePath, content, { 
      encoding: 'utf8',
      flag: 'w' // 覆盖写入
    });
    
    // 验证文件是否成功写入
    const stats = await fs.stat(filePath);
    console.log(`成功保存文件到: ${filePath}, 文件大小: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    return filePath;
  } catch (error) {
    console.error('保存文件失败:', error);
    // 更详细地记录错误信息
    if (error instanceof Error) {
      console.error('错误类型:', error.name);
      console.error('错误消息:', error.message);
      console.error('错误堆栈:', error.stack);
    }
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
    
    // 检查提示词大小，尝试减少内容
    const promptSizeInKB = Buffer.byteLength(prompt, 'utf8') / 1024;
    console.log(`提示词已生成，长度: ${prompt.length} 字符，大小: ${promptSizeInKB.toFixed(2)} KB`);
    
    // 如果提示词太大，尝试减少内容
    let optimizedPrompt = prompt;
    if (promptSizeInKB > 50) {
      console.log('提示词较大，尝试优化...');
      
      // 检查提示词是否包含非ASCII字符
      const hasNonAsciiChars = /[^\x00-\x7F]/.test(prompt);
      if (hasNonAsciiChars) {
        console.log('检测到提示词包含非ASCII字符（如中文），确保正确编码');
      }
      
      // 这里可以实现更复杂的优化逻辑，比如删减学习资料
      // 目前我们只确保编码正确
    }
    
    // 确保提示词是有效的UTF-8字符串
    try {
      // 尝试对提示词进行解码再编码，确保字符编码正确
      const encoder = new TextEncoder();
      const decoder = new TextDecoder('utf-8');
      const encoded = encoder.encode(optimizedPrompt);
      optimizedPrompt = decoder.decode(encoded);
      
      console.log('已处理提示词编码，确保UTF-8兼容性');
    } catch (encodeError) {
      console.error('提示词编码处理失败:', encodeError);
      // 如果处理失败，保留原始提示词
    }
    
    // 生成唯一的文件名
    const timestamp = Date.now();
    const promptFilename = `prompt_${timestamp}.txt`;
    
    // 异步保存提示词到文件
    const savePromptPromise = saveToFile(promptFilename, optimizedPrompt);
    
    try {
      // 记录提示词长度
      console.log(`提示词已生成，长度: ${optimizedPrompt.length} 字符`);
      
      // 获取知识点数量，用于处理学习计划
      const knowledgePointsCount = learningMaterials?.knowledgePoints?.length || 30;
      console.log(`知识点数量: ${knowledgePointsCount}，将均匀分配到30天学习计划中`);
      
      // 调用AI API，传递知识点数量
      const result = await callAIAPI(optimizedPrompt, knowledgePointsCount);
      console.log('成功从API获取响应');
      
      // 等待提示词保存完成
      await savePromptPromise;
      
      // 保存API响应到文件
      const responseFilename = `response_${timestamp}.json`;
      try {
        // 检查结果的完整性
        if (!result.dailyPlans || result.dailyPlans.length === 0) {
          console.warn('警告: 返回的AI响应缺少dailyPlans或为空');
        } else if (result.dailyPlans.length < 10) {
          console.warn(`警告: 返回的dailyPlans数量较少，只有${result.dailyPlans.length}天`);
        }
        
        // 使用JSON.stringify处理大型响应内容
        const responseJson = JSON.stringify(result, null, 2);
        console.log(`API响应序列化完成，JSON长度: ${responseJson.length} 字符`);
        
        // 保存完整内容到文件
        await saveToFile(responseFilename, responseJson);
        
        // 额外记录一些响应信息用于调试
        const summaryFilename = `summary_${timestamp}.txt`;
        const summary = `
          响应概览:
          - 阶段数量: ${result.phases?.length || 0}
          - 日计划数量: ${result.dailyPlans?.length || 0}
          - JSON大小: ${responseJson.length} 字符
          - 生成时间: ${new Date().toISOString()}
        `;
        await saveToFile(summaryFilename, summary);
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
        await saveToFile(errorFilename, `API调用失败: ${apiError}\n\n原始提示词:\n${optimizedPrompt}`);
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
 * @description 从数据库构建学习资料数据 - 专注于基础护理学
 * @param {SurveyFormData} _surveyData - 用户表单数据 (renamed as unused)
 * @returns {Promise<LearningMaterial>} 学习资料数据
 */
async function buildLearningMaterialsData(_surveyData: SurveyFormData): Promise<LearningMaterial> {
  try {
    // 仅获取专业实践能力考试科目
    const examSubjects = await fetchPracticalExamSubject();
    
    // 仅获取基础护理学学科
    const basicNursingDiscipline = await fetchBasicNursingDiscipline();
    
    if (!basicNursingDiscipline) {
      throw new Error('未找到基础护理学学科数据');
    }
    
    // 获取基础护理学的章节
    const chapters = await fetchChaptersByDiscipline(basicNursingDiscipline.id);
    
    // 获取这些章节相关的知识点
    const chapterIds = chapters.map(chapter => chapter.id);
    const knowledgePoints = await fetchKnowledgePointsByChapters(chapterIds);
    
    // 构建基础护理学与章节的关系
    console.log('构建基础护理学与章节的关系');
    const nursingDisciplineWithChapters = {
      ...basicNursingDiscipline,
      chapters: chapters.map(chapter => {
        // 为每个章节添加关联的知识点
        const chapterKnowledgePoints = knowledgePoints.filter(kp => kp.chapter_id === chapter.id);
        return {
          ...chapter,
          knowledgePoints: chapterKnowledgePoints
        };
      })
    };
    
    // 返回专注于基础护理学的学习资料结构
    return {
      examSubjects: examSubjects,
      nursingDisciplines: [nursingDisciplineWithChapters],
      knowledgePoints: knowledgePoints,
      testBanks: [] // 不再需要题库数据
    };
  } catch (error) {
    console.error('构建基础护理学学习资料数据失败:', error);
    throw error;
  }
}

/**
 * @description 仅获取专业实践能力考试科目
 * @returns {Promise<any[]>} 专业实践能力考试科目
 */
async function fetchPracticalExamSubject(): Promise<any[]> {
  try {
    const result = await directDb.executeQuery(`
      SELECT id, name, description, weight
      FROM exam_subjects
      WHERE name LIKE '%专业实践能力%' OR id = 4
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      console.warn('未找到专业实践能力科目，尝试获取所有科目');
      const allSubjects = await directDb.executeQuery(`
        SELECT id, name, description, weight
        FROM exam_subjects
        LIMIT 1
      `);
      return allSubjects.rows;
    }
    
    return result.rows;
  } catch (error) {
    console.error('获取专业实践能力考试科目失败:', error);
    return [];
  }
}

/**
 * @description 仅获取基础护理学学科
 * @returns {Promise<any|null>} 基础护理学学科
 */
async function fetchBasicNursingDiscipline(): Promise<any|null> {
  try {
    const result = await directDb.executeQuery(`
      SELECT id, name, description
      FROM nursing_disciplines
      WHERE name LIKE '%基础护理学%' OR id = 4
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      console.warn('未找到基础护理学学科，尝试获取任意一个学科');
      const anyDiscipline = await directDb.executeQuery(`
        SELECT id, name, description
        FROM nursing_disciplines
        LIMIT 1
      `);
      return anyDiscipline.rows[0] || null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('获取基础护理学学科失败:', error);
    return null;
  }
}

/**
 * @description 获取指定章节的所有知识点
 * @param {number[]} chapterIds - 章节ID数组
 * @returns {Promise<any[]>} 知识点列表
 */
async function fetchKnowledgePointsByChapters(chapterIds: number[]): Promise<any[]> {
  if (!chapterIds.length) {
    return [];
  }
  
  try {
    // 构建查询条件
    const placeholders = chapterIds.map((_, index) => `$${index + 1}`).join(',');
    
    const result = await directDb.executeQuery(`
      SELECT kp.id, kp.subject_id, kp.chapter_id, kp.title, kp.content,
             c.name as chapter_name, es.name as subject_name,
             c.discipline_id, kp.difficulty, kp.importance
      FROM knowledge_points kp
      JOIN chapters c ON kp.chapter_id = c.id
      JOIN exam_subjects es ON kp.subject_id = es.id
      WHERE kp.chapter_id IN (${placeholders})
      ORDER BY c.order_index, kp.id
    `, chapterIds);
    
    console.log(`获取到${result.rows.length}个与基础护理学相关的知识点`);
    return result.rows;
  } catch (error) {
    console.error('获取章节相关知识点失败:', error);
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