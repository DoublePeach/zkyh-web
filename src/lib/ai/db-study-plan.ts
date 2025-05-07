/**
 * @description 基于数据库数据生成备考规划
 * @author 郝桃桃
 * @date 2024-08-05
 */

import { SurveyFormData } from '@/types/survey';
import { OpenAI } from 'openai';
import { DB_CONFIG, AI_CONFIG } from '@/lib/config';
import * as directDb from '@/lib/direct-db';

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

interface KnowledgePoint { // 新增接口
  id: number;
  subject_id: number;
  chapter_id: number;
  name: string;
  content?: string; // 假设知识点有内容字段
  chapter_name?: string; 
  subject_name?: string; 
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
    monthlyPlan?: string;
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
  nextSteps?: string;
}

// 最大每日规划生成天数
const MAX_DAILY_PLAN_DAYS = 30;

/**
 * @description 获取所有考试科目
 * @returns {Promise<ExamSubject[]>} 考试科目列表
 */
async function fetchExamSubjects(): Promise<ExamSubject[]> {
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
 * @returns {Promise<NursingDiscipline[]>} 护理学科列表
 */
async function fetchNursingDisciplines(): Promise<NursingDiscipline[]> {
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
 * @returns {Promise<Chapter[]>} 章节列表
 */
async function fetchChaptersByDiscipline(disciplineId: number): Promise<Chapter[]> {
  try {
    const result = await directDb.executeQuery(`
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
    const result = await directDb.executeQuery(`
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
    const result = await directDb.executeQuery(`
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
    const result = await directDb.executeQuery(`
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
 * @description 获取所有知识点
 * @param {number[]} subjectIds - 考试科目ID数组
 * @returns {Promise<KnowledgePoint[]>} 知识点列表
 */
async function fetchKnowledgePointsBySubjectIds(subjectIds: number[]): Promise<KnowledgePoint[]> {
  if (!subjectIds || subjectIds.length === 0) return [];
  try {
    const placeholders = subjectIds.map((_, i) => `$${i + 1}`).join(',');
    const query = `
      SELECT kp.id, kp.subject_id, kp.chapter_id, kp.title as name, kp.content, 
             c.name as chapter_name, es.name as subject_name
      FROM knowledge_points kp
      LEFT JOIN chapters c ON kp.chapter_id = c.id
      LEFT JOIN exam_subjects es ON kp.subject_id = es.id
      WHERE kp.subject_id IN (${placeholders})
      ORDER BY kp.subject_id, kp.chapter_id, kp.id;
    `;
    const result = await directDb.executeQuery(query, subjectIds);
    console.log(`获取知识点成功，查询条件: subject_ids=${subjectIds.join(', ')}, 结果数量: ${result.rows.length}`);
    return result.rows;
  } catch (error) {
    console.error(`获取知识点失败 (subject_ids: ${subjectIds.join(', ')}):`, error);
    return [];
  }
}

/**
 * @description 获取所有章节
 * @param {number[]} chapterIds - 章节ID数组
 * @returns {Promise<Chapter[]>} 章节列表
 */
async function fetchChaptersByIds(chapterIds: number[]): Promise<Chapter[]> {
  if (!chapterIds || chapterIds.length === 0) return [];
  try {
    const placeholders = chapterIds.map((_, i) => `$${i + 1}`).join(',');
    const query = `
      SELECT c.id, c.discipline_id, c.name, c.description, c.order_index, nd.name as discipline_name
      FROM chapters c
      LEFT JOIN nursing_disciplines nd ON c.discipline_id = nd.id
      WHERE c.id IN (${placeholders})
      ORDER BY c.discipline_id, c.order_index;
    `;
    const result = await directDb.executeQuery(query, chapterIds);
    return result.rows;
  } catch (error) {
    console.error(`获取章节失败 (ids: ${chapterIds.join(', ')}):`, error);
    return [];
  }
}

/**
 * @description 获取所有护理学科
 * @param {number[]} disciplineIds - 护理学科ID数组
 * @returns {Promise<NursingDiscipline[]>} 护理学科列表
 */
async function fetchDisciplinesByIds(disciplineIds: number[]): Promise<NursingDiscipline[]> {
  if (!disciplineIds || disciplineIds.length === 0) return [];
  try {
    const placeholders = disciplineIds.map((_, i) => `$${i + 1}`).join(',');
    const query = `
      SELECT id, name, description 
      FROM nursing_disciplines 
      WHERE id IN (${placeholders})
      ORDER BY id;
    `;
    const result = await directDb.executeQuery(query, disciplineIds);
    return result.rows;
  } catch (error) {
    console.error(`获取护理学科失败 (ids: ${disciplineIds.join(', ')}):`, error);
    return [];
  }
}

/**
 * @description 构建学习资料数据结构
 * @param {SurveyFormData} surveyData - 用户表单数据，用于确定需要获取哪些科目的资料
 * @returns {Promise<any>} 包含所有学习资料的数据结构
 */
async function buildLearningMaterialsData(surveyData: SurveyFormData): Promise<any> {
  try {
    console.log('开始从数据库构建学习资料数据 (新版 v2)...');
    const userSelectedSubjectNames = mapSurveySubjectsToExamSubjectNames(surveyData);

    const allDbExamSubjects = await fetchExamSubjects();
    if (allDbExamSubjects.length === 0) {
      console.error("数据库中未找到任何考试科目。");
      return { examSubjects: [], nursingDisciplines: [], knowledgePoints: [], testBanks: [] };
    }

    let targetExamSubjects: ExamSubject[];
    if (userSelectedSubjectNames.length > 0) {
      targetExamSubjects = allDbExamSubjects.filter(s => userSelectedSubjectNames.includes(s.name));
      if (targetExamSubjects.length === 0) {
        console.warn(`根据用户选择的映射科目名称 [${userSelectedSubjectNames.join(', ')}] 未在数据库中匹配到任何考试科目，将使用所有科目。请检查映射逻辑和数据库科目名称。`);
        targetExamSubjects = [...allDbExamSubjects];
      }
    } else {
      console.log("映射未返回具体科目名称 (可能表示全选或映射问题)，将使用所有考试科目。");
      targetExamSubjects = [...allDbExamSubjects];
    }
    
    console.log(`最终用于查询的目标考试科目: ${targetExamSubjects.map(s => `${s.name}(id:${s.id})`).join(', ')} (共 ${targetExamSubjects.length} 个)`);
    const targetExamSubjectIds = targetExamSubjects.map(s => s.id);

    if (targetExamSubjectIds.length === 0) {
      console.log("没有确定的考试科目ID，无法获取知识点、章节和学科。");
      // Return selected subjects even if empty, plus empty related data.
      return { examSubjects: targetExamSubjects, nursingDisciplines: [], knowledgePoints: [], testBanks: [] };
    }

    const knowledgePoints = await fetchKnowledgePointsBySubjectIds(targetExamSubjectIds);
    console.log(`获取到 ${knowledgePoints.length} 个相关知识点。`);

    const chapterIdsFromKnowledgePoints = Array.from(new Set(knowledgePoints.map(kp => kp.chapter_id).filter(id => id != null))) as number[];
    if (chapterIdsFromKnowledgePoints.length === 0 && knowledgePoints.length > 0) {
        console.warn("获取到知识点，但未能提取到有效的章节ID (chapter_id is null or undefined in all KPs)。");
    }
    console.log(`从知识点中提取到 ${chapterIdsFromKnowledgePoints.length} 个唯一章节ID。`);
    const chapters = chapterIdsFromKnowledgePoints.length > 0 ? await fetchChaptersByIds(chapterIdsFromKnowledgePoints) : [];
    console.log(`获取到 ${chapters.length} 个相关章节。`);
    if (chapters.length === 0 && chapterIdsFromKnowledgePoints.length > 0) {
        console.warn(`尝试获取 ${chapterIdsFromKnowledgePoints.length} 个章节ID，但结果为空。检查 chapters 表或 IDs: ${chapterIdsFromKnowledgePoints.join(',')}`);
    }


    const disciplineIdsFromChapters = Array.from(new Set(chapters.map(c => c.discipline_id).filter(id => id != null))) as number[];
    if (disciplineIdsFromChapters.length === 0 && chapters.length > 0) {
        console.warn("获取到章节，但未能提取到有效的护理学科ID (discipline_id is null or undefined in all chapters)。");
    }
    console.log(`从章节中提取到 ${disciplineIdsFromChapters.length} 个唯一护理学科ID。`);
    const nursingDisciplines = disciplineIdsFromChapters.length > 0 ? await fetchDisciplinesByIds(disciplineIdsFromChapters) : [];
    console.log(`获取到 ${nursingDisciplines.length} 个相关护理学科。`);
     if (nursingDisciplines.length === 0 && disciplineIdsFromChapters.length > 0) {
        console.warn(`尝试获取 ${disciplineIdsFromChapters.length} 个护理学科ID，但结果为空。检查 nursing_disciplines 表或 IDs: ${disciplineIdsFromChapters.join(',')}`);
    }

    const disciplinesWithData = nursingDisciplines.map(discipline => {
      const chaptersForDiscipline = chapters.filter(c => c.discipline_id === discipline.id);
      return {
        ...discipline,
        chapters: chaptersForDiscipline.map(chapter => {
          const knowledgePointsForChapter = knowledgePoints.filter(kp => kp.chapter_id === chapter.id);
          return {
            ...chapter,
            knowledgePoints: knowledgePointsForChapter.map(kp => ({ id: kp.id, name: kp.name, content: kp.content })) // Select specific KP fields
          };
        })
      };
    });
    
    const examSubjectsWithData = targetExamSubjects.map(subject => {
      const kps = knowledgePoints.filter(kp => kp.subject_id === subject.id);
      const chapIds = Array.from(new Set(kps.map(kp => kp.chapter_id)));
      const subjectChapters = chapters.filter(c => chapIds.includes(c.id));
      const discIds = Array.from(new Set(subjectChapters.map(c => c.discipline_id)));
      const relatedDisciplines = nursingDisciplines.filter(d => discIds.includes(d.id));
      return {
          ...subject,
          relatedKnowledgePointsCount: kps.length,
          relatedChapters: subjectChapters.map(sc => ({id: sc.id, name: sc.name, description: sc.description})), // Simplified chapter info
          relatedDisciplines: relatedDisciplines.map(rd => ({id: rd.id, name: rd.name})) // Simplified discipline info
      };
    });

    // Fetch test banks related to the target exam subjects
    let relevantTestBanks: TestBank[] = [];
    if (targetExamSubjectIds.length > 0) {
        for (const subjectId of targetExamSubjectIds) {
            const banks = await fetchTestBanksBySubject(subjectId); // Assuming this function exists and works
            relevantTestBanks.push(...banks);
        }
    }
    console.log(`获取到 ${relevantTestBanks.length} 个相关题库。`);

    console.log('学习资料数据构建完成 (新版 v2)');
    return {
      examSubjects: examSubjectsWithData, 
      nursingDisciplines: disciplinesWithData, 
      // knowledgePoints: knowledgePoints.map(kp => ({id: kp.id, name: kp.name, subject_name: kp.subject_name, chapter_name: kp.chapter_name})), // Optional: flattened list for AI
      testBanks: relevantTestBanks 
    };

  } catch (error) {
    console.error('构建学习资料数据结构失败 (新版 v2):', error);
    return { examSubjects: [], nursingDisciplines: [], knowledgePoints: [], testBanks: [] };
  }
}

/**
 * @description 生成本地备考规划数据（作为外部API失败时的备选方案）
 * @param {SurveyFormData} surveyData - 调查问卷数据
 * @param {any} learningMaterials - 学习资料数据
 * @param {number} daysUntilExam - 距离考试的天数
 * @returns {AIResponseData} 本地生成的备考规划数据
 */
function generateLocalStudyPlan(surveyData: SurveyFormData, learningMaterials: any, daysUntilExam: number): AIResponseData {
  console.log('使用本地生成方案创建备考规划...');
  
  // 判断是否是长期规划（超过MAX_DAILY_PLAN_DAYS天）
  const isLongTermPlan = daysUntilExam > MAX_DAILY_PLAN_DAYS;
  const planGenerationDays = isLongTermPlan ? MAX_DAILY_PLAN_DAYS : daysUntilExam;
  
  console.log(`本地生成方案: 总备考时间${daysUntilExam}天，${isLongTermPlan ? `将只生成近${planGenerationDays}天的详细规划` : '将生成完整的每日规划'}`);
  
  // 获取可用的资源数据
  const examSubjects: Array<{id: number; name: string; description?: string}> = learningMaterials.examSubjects || [];
  const nursingDisciplines: Array<{id: number; name: string; description?: string; chapters?: any[]}> = learningMaterials.nursingDisciplines || [];
  
  // 计算各阶段天数
  const phase1Days = Math.floor(daysUntilExam * 0.4);
  const phase2Days = Math.floor(daysUntilExam * 0.3);
  const phase3Days = daysUntilExam - phase1Days - phase2Days;
  
  // 生成日期
  const today = new Date();
  const formatDate = (dayOffset: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    return date.toLocaleDateString('zh-CN');
  };
  
  // 创建阶段（包含长期规划特有的monthlyPlan字段）
  const phases = [
    {
      id: 1,
      name: "基础学习阶段",
      description: "此阶段重点掌握基础知识点，建立知识框架",
      startDay: 1,
      endDay: phase1Days,
      focusAreas: ["基础医学知识", "护理基础", "专科护理理论"],
      learningGoals: [
        "建立完整的护理知识框架",
        "掌握基础医学和护理学核心概念",
        "熟悉主要考试科目的核心内容"
      ],
      recommendedResources: examSubjects.slice(0, 3).map((s: {name: string}) => s.name) || ["基础医学", "护理学基础", "内科护理学"],
      monthlyPlan: isLongTermPlan ? `第1-${Math.min(30, phase1Days)}天：系统学习基础概念和理论
第${Math.min(31, phase1Days + 1)}-${Math.min(60, phase1Days)}天：完成核心章节学习
第${Math.min(61, phase1Days + 1)}天及以后：巩固基础知识，开始涉及进阶内容` : undefined
    },
    {
      id: 2,
      name: "重点强化阶段",
      description: "此阶段针对难点内容进行强化学习，加深理解",
      startDay: phase1Days + 1,
      endDay: phase1Days + phase2Days,
      focusAreas: ["重点章节", "难点知识", "临床应用案例"],
      learningGoals: [
        "攻克学习难点",
        "加深对核心知识的理解",
        "提高知识应用能力"
      ],
      recommendedResources: nursingDisciplines.slice(0, 3).map((d: {name: string}) => d.name) || ["内科护理学", "外科护理学", "妇产科护理学"],
      monthlyPlan: isLongTermPlan ? `第1-30天：针对性学习难点章节
第31-60天：强化专业课程学习
第61天及以后：开始结合习题进行知识应用` : undefined
    },
    {
      id: 3,
      name: "模拟冲刺阶段",
      description: "此阶段以模拟试题和真题练习为主，查漏补缺",
      startDay: phase1Days + phase2Days + 1,
      endDay: daysUntilExam,
      focusAreas: ["模拟试题", "历年真题", "综合能力提升"],
      learningGoals: [
        "熟悉考试题型和答题技巧",
        "查漏补缺，巩固薄弱环节",
        "提高考试应变能力"
      ],
      recommendedResources: ["历年真题集", "模拟试卷", "知识点总结"],
      monthlyPlan: isLongTermPlan ? `第1-30天：开始做模拟题，查漏补缺
考前1个月：全面模拟考试训练
考前2周：复习重点内容，调整状态` : undefined
    }
  ];
  
  // 生成每日计划（只生成指定天数）
  const dailyPlans = [];
  
  // 抽取可用的学习材料
  const availableSubjects = examSubjects.map((s: {name: string}) => s.name);
  const availableChapters: string[] = [];
  nursingDisciplines.forEach((discipline: {name: string; chapters?: Array<{name: string}>}) => {
    if (discipline.chapters && discipline.chapters.length > 0) {
      discipline.chapters.forEach((chapter: {name: string}) => {
        availableChapters.push(`${discipline.name}-${chapter.name}`);
      });
    }
  });
  
  // 为每一天生成计划 - 仅生成planGenerationDays天的计划
  for (let day = 1; day <= planGenerationDays; day++) {
    // 确定当前所属阶段
    let phaseId = 1;
    if (day > phase1Days + phase2Days) {
      phaseId = 3;
    } else if (day > phase1Days) {
      phaseId = 2;
    }
    
    // 根据阶段和日期生成任务
    const subjects: string[] = [];
    const tasks = [];
    
    // 添加科目（根据阶段不同选择不同科目）
    if (availableSubjects.length > 0) {
      const subjectIndex = (day - 1) % availableSubjects.length;
      subjects.push(availableSubjects[subjectIndex]);
      if (day % 2 === 0 && availableSubjects.length > 1) {
        const nextIndex = (subjectIndex + 1) % availableSubjects.length;
        subjects.push(availableSubjects[nextIndex]);
      }
    }
    
    // 生成任务
    if (phaseId === 1) {
      // 基础阶段任务
      tasks.push({
        title: `学习${subjects[0] || '基础医学'}的核心概念`,
        description: `系统学习${subjects[0] || '基础医学'}的基本理论和核心概念，建立知识框架`,
        duration: 90,
        resources: availableChapters.slice(0, 2)
      });
      tasks.push({
        title: "课后习题练习",
        description: "完成相关章节的课后习题，巩固所学内容",
        duration: 60,
        resources: ["课后习题集"]
      });
    } else if (phaseId === 2) {
      // 强化阶段任务
      tasks.push({
        title: `${subjects[0] || '护理学'}重点内容学习`,
        description: `深入学习${subjects[0] || '护理学'}的重点和难点内容，加强理解`,
        duration: 90,
        resources: availableChapters.slice(2, 4)
      });
      tasks.push({
        title: "案例分析练习",
        description: "通过典型案例加深对知识点的理解和应用",
        duration: 60,
        resources: ["护理案例集"]
      });
    } else {
      // 冲刺阶段任务
      tasks.push({
        title: "模拟试题练习",
        description: "完成一套完整的模拟试题，掌握答题技巧",
        duration: 90,
        resources: ["模拟试卷", "历年真题"]
      });
      tasks.push({
        title: "重点知识回顾",
        description: "回顾易错和重点知识点，查漏补缺",
        duration: 60,
        resources: ["知识点总结", "考点精讲"]
      });
    }
    
    // 生成当天计划
    dailyPlans.push({
      day,
      date: formatDate(day - 1),
      phaseId,
      title: `第${day}天学习计划`,
      subjects,
      tasks,
      reviewTips: `在今天学习结束后，花15分钟回顾${subjects.join('和')}的核心概念，确保知识点能够串联`
    });
  }
  
  // 添加对长期规划的后续步骤建议（仅长期规划需要）
  const nextSteps = isLongTermPlan ? 
    `完成前${planGenerationDays}天学习后，建议：
1. 评估学习进度和掌握程度
2. 进行一次阶段性测试，找出薄弱环节
3. 结合测试结果，重新规划下一阶段的学习内容
4. 调整学习方法和时间分配，确保学习效率` : undefined;
  
  // 返回完整的备考规划（添加长期规划特有字段）
  return {
    overview: `这份备考规划基于您的${surveyData.titleLevel === 'junior' ? '初级护师' : '主管护师'}备考需求制定，
结合您的学习基础和可用时间，将${daysUntilExam}天的备考时间分为基础、强化和冲刺三个阶段。
每个阶段设置了不同的学习重点和目标，并提供了详细的每日学习计划。
${isLongTermPlan ? `鉴于备考时间较长，目前仅提供近${planGenerationDays}天的详细规划，之后可根据学习进度进行调整。` : ''}
建议您严格按照计划执行，合理安排时间，定期复习，确保学习效果。`,
    phases,
    dailyPlans,
    ...(isLongTermPlan && { nextSteps })
  };
}

/**
 * @description 根据调查问卷数据和数据库学习资料生成备考规划
 * @param {SurveyFormData} surveyData - 调查问卷数据
 * @returns {Promise<AIResponseData>} AI生成的备考规划
 */
export async function generateStudyPlanFromDatabase(surveyData: SurveyFormData): Promise<AIResponseData> {
  try {
    // 打印数据库连接信息
    const connectionInfo = DB_CONFIG.PG_CONNECTION_STRING.replace(/:[^@]*@/, ':***@');
    console.log('使用数据库连接:', connectionInfo);
    
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
    
    // 确定是否需要限制每日规划的生成天数
    const isLongTermPlan = daysUntilExam > MAX_DAILY_PLAN_DAYS;
    const planGenerationDays = isLongTermPlan ? MAX_DAILY_PLAN_DAYS : daysUntilExam;
    
    console.log(`距离考试还有${daysUntilExam}天，${isLongTermPlan ? `将只生成近${MAX_DAILY_PLAN_DAYS}天的详细规划` : '将生成完整的每日规划'}`);
    
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
    
    // 从数据库获取学习资料，传入surveyData以筛选相关资料
    console.log('从数据库获取学习资料...');
    const learningMaterials = await buildLearningMaterialsData(surveyData);
    console.log('成功获取学习资料:', 
      `考试科目数量: ${learningMaterials.examSubjects.length}, ` + 
      `护理学科数量: ${learningMaterials.nursingDisciplines.length}`
    );
    
    // 打印API配置信息
    console.log('API配置信息:');
    console.log('- DEFAULT_PROVIDER:', AI_CONFIG.DEFAULT_PROVIDER);
    console.log('- DEFAULT_MODEL:', AI_CONFIG.DEFAULT_MODEL);
    console.log('- CURRENT_API_KEY (前10位):', AI_CONFIG.CURRENT_API_KEY?.substring(0, 10) + '***');
    console.log('- CURRENT_BASE_URL:', AI_CONFIG.CURRENT_BASE_URL);
    console.log('- DEEPSEEK_API_KEY (前10位):', AI_CONFIG.DEEPSEEK_API_KEY?.substring(0, 10) + '***');
    console.log('- DEEPSEEK_BASE_URL:', AI_CONFIG.DEEPSEEK_BASE_URL);
    
    // 构建中文提示词
    const prompt = `你是一位专业的医卫职称备考规划专家，擅长为医疗从业人员制定个性化的备考计划。
请根据以下用户信息以及数据库中的实际学习资料生成一个详细的备考规划。

## 用户基本信息
- 报考职称: ${titleLevel}
- 考试状态: ${examStatus}
- 学习基础: ${studyBaseDescription}
- 学习时间安排: 
  * 每周工作日学习: ${weekdaysCountDesc}
  * ${weekdayHoursDesc}
  * ${weekendHoursDesc}
- 距离考试还有${daysUntilExam}天，考试日期: ${examDate.toLocaleDateString('zh-CN')}

## 规划需求说明
距离考试还有${daysUntilExam}天，${isLongTermPlan ? `但用户只需要近${planGenerationDays}天的详细每日规划` : '需要完整的每日规划'}。
请设计一个满足以下要求的备考规划：
1. 必须包含完整的三个学习阶段（基础、强化、冲刺），并根据总备考时间${daysUntilExam}天合理分配各阶段时长
2. ${isLongTermPlan ? `仅提供前${planGenerationDays}天的详细每日学习任务，之后用户将根据进度进行重新规划` : '提供完整每日规划'}
3. 每个阶段必须有明确的学习重点和目标
4. 学习资源必须基于数据库中提供的实际资料
5. 考虑用户的学习基础、可用时间，提供最适合的进度安排

## 数据库中的学习资料
${JSON.stringify(learningMaterials, null, 2)}

## 请返回以下JSON格式的规划
请返回一个JSON对象，包含以下内容(字段名称保持英文，内容使用中文):

{
  "overview": "整体备考规划总览，描述整个备考周期的学习安排、关键建议和进度",
  "phases": [
    {
      "id": 1,
      "name": "基础学习阶段",
      "description": "阶段详细描述",
      "startDay": 1,
      "endDay": X, // 具体天数
      "focusAreas": ["重点领域1", "重点领域2", "..."],
      "learningGoals": ["目标1", "目标2", "..."],
      "recommendedResources": ["资源1", "资源2", "..."],
      "monthlyPlan": ${isLongTermPlan ? '"此阶段每月学习要点和建议，帮助用户了解长期规划"' : 'null'} // 仅长期规划需要
    },
    {
      "id": 2,
      "name": "重点强化阶段",
      "description": "阶段详细描述", 
      "startDay": X+1,
      "endDay": Y, // 具体天数
      "focusAreas": ["重点领域1", "重点领域2", "..."],
      "learningGoals": ["目标1", "目标2", "..."],
      "recommendedResources": ["资源1", "资源2", "..."],
      "monthlyPlan": ${isLongTermPlan ? '"此阶段每月学习要点和建议，帮助用户了解长期规划"' : 'null'} // 仅长期规划需要
    },
    {
      "id": 3,
      "name": "模拟冲刺阶段",
      "description": "阶段详细描述",
      "startDay": Y+1,
      "endDay": ${daysUntilExam}, // 到考试前一天
      "focusAreas": ["重点领域1", "重点领域2", "..."],
      "learningGoals": ["目标1", "目标2", "..."],
      "recommendedResources": ["资源1", "资源2", "..."],
      "monthlyPlan": ${isLongTermPlan ? '"此阶段每月学习要点和建议，帮助用户了解长期规划"' : 'null'} // 仅长期规划需要
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
          "description": "任务1详细描述",
          "duration": 60, // 预计时长（分钟）
          "resources": ["资源链接或描述1", "资源链接或描述2"]
        },
        // 更多任务...
      ],
      "reviewTips": "当天复习建议"
    },
    // ${isLongTermPlan ? `只需生成前${planGenerationDays}天的每日计划` : `生成所有${daysUntilExam}天的每日计划`}
  ],
  ${isLongTermPlan ? `"nextSteps": "提供用户完成${planGenerationDays}天学习后的后续操作建议，如何评估进度、调整计划等"` : ''}
}

请特别注意：
1. 每日计划中的任务总时长应符合用户可用学习时间
2. 工作日和周末的学习安排应有差异，周末可安排更多时间的学习任务
3. 学习资源必须来自数据库中提供的学习资料，使用真实的学科名称和章节名称
4. 根据用户基础水平调整学习进度和难度
5. ${isLongTermPlan ? `每个阶段需要提供monthlyPlan，帮助用户了解长期学习规划` : ''}

请确保返回的JSON格式正确无误，能够被JavaScript的JSON.parse()直接解析。
返回的内容必须是一个完整且语法完全正确的JSON对象。所有括号（花括号{}和方括号[]）都必须正确配对并闭合。
绝对不要在JSON有效负载之外包含任何文本、注释、Markdown标记（如 \`\`\`json）或任何其他非JSON字符。
JSON字符串本身不应包含任何导致解析错误的控制字符或未转义的特殊字符。`;

    try {
      // 使用OpenAI生成带有数据库学习资料的备考规划
      console.log('开始调用AI生成备考规划...');
      
      const apiKey = AI_CONFIG.DEEPSEEK_API_KEY || 'sk-ed222c4e2fcc4a64af6b3692e29cf443'; // Use configured or fallback
      const baseUrl = AI_CONFIG.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1/chat/completions';
      // 使用有效的 DeepSeek 模型名称，v1.5-32b/v2.5-32b是DeepSeek提供的模型名称
      const model = 'deepseek-chat'; 
      
      // 打印认证信息(脱敏处理)
      console.log('使用Deepseek API密钥:', apiKey.substring(0, 10) + '***');
      console.log('使用Deepseek API URL:', baseUrl);
      console.log('使用模型:', model);
      
      // 尝试调用API
      try {
        console.log('开始API请求...');
        
        // 请求配置
        const requestBody = {
          model: model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3, // Lowered temperature for more consistent output
          max_tokens: 8000,  // Increased max_tokens to handle full plan
        };
        
        console.log('API请求配置 (部分):', JSON.stringify({
          model: requestBody.model,
          temperature: requestBody.temperature,
          max_tokens: requestBody.max_tokens,
          message_prompt_length_chars: requestBody.messages[0].content.length 
        }));
        
        // 执行API调用
        try {
          console.log('执行 Deepseek API 调用...');
          
          const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
          });
          
          console.log('API响应状态码:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('API返回错误状态码:', response.status);
            console.error('错误详情:', errorText);
            
            // 尝试更改模型名称重新请求
            if (response.status === 400 && errorText.includes("Model Not Exist")) {
              console.log('尝试使用备选模型名称重新请求...');
              
              // 尝试使用不同的模型名称
              const fallbackModel = 'deepseek-coder';
              
              console.log('使用备选模型:', fallbackModel);
              
              const fallbackRequestBody = {
                ...requestBody,
                model: fallbackModel
              };
              
              const fallbackResponse = await fetch(baseUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(fallbackRequestBody)
              });
              
              if (!fallbackResponse.ok) {
                const fallbackErrorText = await fallbackResponse.text();
                console.error('备选模型请求也失败:', fallbackResponse.status);
                console.error('备选模型错误详情:', fallbackErrorText);
                console.log('将使用本地生成方案');
                return generateLocalStudyPlan(surveyData, learningMaterials, daysUntilExam);
              }
              
              // 如果备选模型成功，使用备选响应
              const fallbackResponseData = await fallbackResponse.json();
              console.log('备选模型API调用成功，响应ID:', fallbackResponseData.id);
              
              // Extract the content string which should contain our desired JSON
              if (!fallbackResponseData.choices || !fallbackResponseData.choices[0] || !fallbackResponseData.choices[0].message || !fallbackResponseData.choices[0].message.content) {
                console.error('API返回了不正确的数据格式，缺少必要字段');
                return generateLocalStudyPlan(surveyData, learningMaterials, daysUntilExam);
              }
              
              const contentText = fallbackResponseData.choices[0].message.content;
              // 处理返回内容逻辑同下...
              return processApiResponse(contentText, surveyData, learningMaterials, daysUntilExam, isLongTermPlan, planGenerationDays);
            }
            
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
          }
          
          const responseData = await response.json();
          console.log('API调用成功，响应ID:', responseData.id);
          console.log('响应选项数量:', responseData.choices?.length);
          
          // Check the expected structure of the API response
          if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message || !responseData.choices[0].message.content) {
            console.error('API返回了不正确的数据格式，缺少必要字段');
            console.error('完整响应:', JSON.stringify(responseData, null, 2));
            throw new Error('API返回了不正确的数据格式');
          }
          
          // Extract the content string which should contain our desired JSON
          const contentText = responseData.choices[0].message.content;
          return processApiResponse(contentText, surveyData, learningMaterials, daysUntilExam, isLongTermPlan, planGenerationDays);
        } catch (fetchError) {
          console.error('Fetch API调用失败:', fetchError);
          if (fetchError instanceof Error) {
            console.error('错误名称:', fetchError.name);
            console.error('错误消息:', fetchError.message);
            console.error('错误堆栈:', fetchError.stack);
          }
          throw fetchError;
        }
      } catch (apiError) {
        console.error('API调用失败，详细错误:');
        console.error('错误类型:', typeof apiError);
        
        if (apiError instanceof Error) {
          console.error('错误名称:', apiError.name);
          console.error('错误消息:', apiError.message);
          console.error('错误堆栈:', apiError.stack);
          if ('cause' in apiError) {
            console.error('错误原因:', apiError.cause);
          }
        } else {
          console.error('非标准错误对象:', apiError);
        }
        
        console.error('将使用本地生成方案');
        return generateLocalStudyPlan(surveyData, learningMaterials, daysUntilExam);
      }
    } catch (error) {
      console.error('基于数据库生成备考规划过程中发生错误，将使用本地生成方案', error);
      return generateLocalStudyPlan(surveyData, learningMaterials, daysUntilExam);
    }
  } catch (error) {
    console.error('基于数据库生成备考规划失败:', error);
    throw error;
  }
}

/**
 * @description 处理API响应内容，提取JSON数据
 * @param {string} contentText - API响应的内容文本
 * @param {SurveyFormData} surveyData - 调查问卷数据
 * @param {any} learningMaterials - 学习资料
 * @param {number} daysUntilExam - 距离考试天数
 * @param {boolean} isLongTermPlan - 是否是长期规划
 * @param {number} planGenerationDays - 规划生成天数
 * @returns {AIResponseData} 处理后的备考规划数据
 */
function processApiResponse(
  contentText: string, 
  surveyData: SurveyFormData, 
  learningMaterials: any, 
  daysUntilExam: number, 
  isLongTermPlan: boolean,
  planGenerationDays: number
): AIResponseData {
  console.log('内容文本长度:', contentText.length);
  // Log the entire raw contentText for debugging, especially on error
  console.log('完整API响应原始内容:', contentText); // ADDED FOR FULL LOGGING
  
  // 打印内容的前后字符，帮助调试
  console.log('内容前10个字符:', JSON.stringify(contentText.substring(0, 10)));
  console.log('内容最后10个字符:', JSON.stringify(contentText.substring(contentText.length - 10)));
  
  // 检查JSON是否完整（括号匹配）
  let isValidJson = false;
  try {
    // 将截取前5000个字符，测试是否包含起始的'{'
    const testJson = contentText.substring(0, Math.min(5000, contentText.length));
    isValidJson = testJson.includes('{') && contentText.includes('}');
    
    // 检查更详细的结构性问题
    let openBraces = 0;
    let openBrackets = 0;
    
    for (let i = 0; i < contentText.length; i++) {
      const char = contentText[i];
      if (char === '{') openBraces++;
      else if (char === '}') openBraces--;
      else if (char === '[') openBrackets++;
      else if (char === ']') openBrackets--;
      
      // 如果括号计数变成负数，说明有不匹配的情况
      if (openBraces < 0 || openBrackets < 0) {
        isValidJson = false;
        console.warn(`在索引 ${i} 处检测到异常括号匹配: '${char}'`);
        break;
      }
    }
    
    // 完整的JSON应该括号计数为0
    if (openBraces !== 0 || openBrackets !== 0) {
      isValidJson = false;
      console.warn(`JSON不完整: 花括号平衡=${openBraces}, 方括号平衡=${openBrackets}`);
    }
    
  } catch (e) {
    console.error('检查JSON完整性时出错:', e);
    isValidJson = false;
  }
  
  if (!isValidJson) {
    console.warn('检测到响应内容可能不是完整JSON，将直接使用本地备选方案');
    return generateLocalStudyPlan(surveyData, learningMaterials, daysUntilExam);
  }
  
  // 处理返回的内容，移除可能的Markdown代码块标记
  let cleanedContent = contentText.trim();
  
  // 更健壮的方式清理Markdown格式
  if (contentText.includes('```')) {
    // 使用正则表达式清理markdown代码块
    const jsonRegex = /```(?:json)?\s*\n?([\s\S]*?)```/;
    const match = contentText.match(jsonRegex);
    
    if (match && match[1]) {
      cleanedContent = match[1].trim();
      console.log('成功提取JSON内容，长度:', cleanedContent.length);
    } else {
      // 尝试使用简单的方法清理
      if (contentText.indexOf('```') === 0) {
        const endPos = contentText.lastIndexOf('```');
        if (endPos > 3) {
          // 找到了开始和结束标记
          let startPos = contentText.indexOf('\n'); // 找到第一行结束位置
          if (startPos === -1) startPos = 6;  // 如果没找到换行，就假设是```json
          
          cleanedContent = contentText.substring(startPos, endPos).trim();
          console.log('使用备选方法提取JSON内容，长度:', cleanedContent.length);
        }
      }
    }
  }
  
  // 确保最终的内容是有效的JSON格式
  if (cleanedContent.charAt(0) !== '{' || cleanedContent.charAt(cleanedContent.length - 1) !== '}') {
    console.warn('清理后的内容不是标准JSON格式，尝试进行额外清理');
    
    // 找到第一个{和最后一个}
    const startBrace = cleanedContent.indexOf('{');
    const endBrace = cleanedContent.lastIndexOf('}');
    
    if (startBrace !== -1 && endBrace !== -1 && startBrace < endBrace) {
      cleanedContent = cleanedContent.substring(startBrace, endBrace + 1);
      console.log('额外清理后的JSON内容长度:', cleanedContent.length);
      
      // 检查是否包含不完整的JSON对象或数组
      const lastCommaCheck = cleanedContent.match(/,\s*["']?\w+["']?\s*:\s*\[\s*["']?[\w\s]+["']?,\s*$/);
      if (lastCommaCheck) {
        console.warn('检测到疑似不完整的数组，尝试修复');
        // 尝试修复不完整的数组
        cleanedContent = cleanedContent.replace(/,\s*$/m, '');
        
        // 检查是否需要闭合数组和对象
        const openBracketCount = (cleanedContent.match(/\[/g) || []).length;
        const closeBracketCount = (cleanedContent.match(/\]/g) || []).length;
        const openBraceCount = (cleanedContent.match(/{/g) || []).length;
        const closeBraceCount = (cleanedContent.match(/}/g) || []).length;
        
        // 添加必要的闭合括号
        if (openBracketCount > closeBracketCount) {
          console.warn(`修复: 添加${openBracketCount - closeBracketCount}个闭合方括号`);
          cleanedContent += ']'.repeat(openBracketCount - closeBracketCount);
        }
        
        if (openBraceCount > closeBraceCount) {
          console.warn(`修复: 添加${openBraceCount - closeBraceCount}个闭合花括号`);
          cleanedContent += '}'.repeat(openBraceCount - closeBraceCount);
        }
      }
    } else {
      console.error('无法找到有效的JSON对象范围，将使用本地备选方案');
      return generateLocalStudyPlan(surveyData, learningMaterials, daysUntilExam);
    }
  }
  
  // 尝试预先验证JSON格式是否有效
  try {
    // 使用function构造函数验证JSON而不执行解析
    // 这只检查语法，不创建对象
    new Function('return ' + cleanedContent);
    console.log('JSON语法验证通过');
  } catch (syntaxError: any) {
    console.error('JSON语法验证失败:', syntaxError.message);
    
    // 尝试最后的修复方案
    try {
      // 使用JSON5（更宽松的JSON解析）的方式模拟修复
      // 这里我们手动实现一些简单的修复
      
      // 1. 移除尾部多余的逗号
      cleanedContent = cleanedContent.replace(/,(\s*[\]}])/g, '$1');
      
      // 2. 确保字符串键值对的引号一致
      // 这个修复相当复杂，这里简化处理
      
      // 3. 最后重新检查花括号和方括号是否配对
      const openBraces = (cleanedContent.match(/{/g) || []).length;
      const closeBraces = (cleanedContent.match(/}/g) || []).length;
      const openBrackets = (cleanedContent.match(/\[/g) || []).length;
      const closeBrackets = (cleanedContent.match(/\]/g) || []).length;
      
      if (openBraces > closeBraces) {
        cleanedContent += '}'.repeat(openBraces - closeBraces);
      }
      
      if (openBrackets > closeBrackets) {
        // 找到最后一个打开的数组位置
        const lastOpenPos = cleanedContent.lastIndexOf('[');
        const subsequentClosePos = cleanedContent.indexOf(']', lastOpenPos);
        
        if (subsequentClosePos === -1) {
          // 需要闭合这个数组，但要确保它在正确的位置
          // 找到最接近的对象结束位置
          const lastClosePos = cleanedContent.lastIndexOf('}');
          
          if (lastClosePos > lastOpenPos) {
            // 在对象结束前插入数组结束
            cleanedContent = 
              cleanedContent.substring(0, lastClosePos) + 
              ']'.repeat(openBrackets - closeBrackets) + 
              cleanedContent.substring(lastClosePos);
          } else {
            // 在最后添加数组结束
            cleanedContent += ']'.repeat(openBrackets - closeBrackets);
          }
        }
      }
      
      console.log('应用最后的修复后，再次尝试解析');
    } catch (fixError) {
      console.error('修复JSON尝试失败:', fixError);
    }
  }
  
  // Now parse the contentText which should be the AIResponseData JSON
  try {
    console.log('正在解析API返回的内容JSON...');
    let parsedResult;
    
    try {
      parsedResult = JSON.parse(cleanedContent);
    } catch (parseError: any) {
      console.error('标准解析失败:', parseError.message);
      
      // 最后的备用方案：使用更宽松的解析或简单地使用本地方案
      console.warn('无法解析JSON，将使用本地备选方案');
      return generateLocalStudyPlan(surveyData, learningMaterials, daysUntilExam);
    }
    
    // 验证解析出的数据结构是否符合预期
    console.log('JSON解析成功，验证数据结构...');
    const overview = parsedResult.overview;
    console.log('overview有效性:', !!overview);
    
    const phases = parsedResult.phases;
    console.log('phases数组长度:', phases?.length || 0);
    if (phases && phases.length > 0) {
      console.log('第一阶段名称:', phases[0].name);
      // 检查是否有monthlyPlan字段（长期规划才有）
      if (isLongTermPlan && phases[0].monthlyPlan) {
        console.log('检测到monthlyPlan字段，长期规划生成成功');
      }
    }
    
    const dailyPlans = parsedResult.dailyPlans;
    console.log('dailyPlans数组长度:', dailyPlans?.length || 0);
    if (dailyPlans && dailyPlans.length > 0) {
      console.log('第一天任务数量:', dailyPlans[0].tasks?.length || 0);
      console.log(`生成了${dailyPlans.length}天的详细规划，${isLongTermPlan ? `限制为${planGenerationDays}天` : `总共${daysUntilExam}天`}`);
    }
    
    // 检查长期规划特有字段
    if (isLongTermPlan && parsedResult.nextSteps) {
      console.log('检测到nextSteps字段，包含后续规划建议');
    }
    
    console.log('API返回数据解析完成，已验证数据结构完整性');
    return parsedResult;
  } catch (parseError) {
    console.error('无法解析返回的内容JSON:', parseError);
    console.error('原始内容文本:', contentText.substring(0, 300) + '...');
    console.error('将使用本地生成方案');
    return generateLocalStudyPlan(surveyData, learningMaterials, daysUntilExam);
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

// This mapping needs to be precise based on your DB's exam_subjects.name values
const mapSurveySubjectsToExamSubjectNames = (surveyData: SurveyFormData): string[] => {
  const subjectNames: string[] = [];
  const { subjects, titleLevel } = surveyData;

  // 调试日志
  console.log(`正在映射用户选择科目，用户选择: ${JSON.stringify(subjects)}, 职称级别: ${titleLevel}`);

  // 更精确的映射，确保与数据库exam_subjects.name完全匹配
  if (subjects.basic) subjectNames.push("基础知识");
  if (subjects.related) subjectNames.push("相关专业知识");
  if (subjects.professional) subjectNames.push("专业知识");
  if (subjects.practical) subjectNames.push("专业实践能力");

  // 处理"全选"和"未选择"情况
  const allCategoriesSelected = subjects.basic && subjects.related && subjects.professional && subjects.practical;
  const noSpecificCategorySelected = !subjects.basic && !subjects.related && !subjects.professional && !subjects.practical;

  // 日志更详细的映射结果
  if (subjectNames.length > 0) {
     console.log(`根据用户选择映射到的考试科目名称: ${subjectNames.join(', ')}`);
     return subjectNames;
  } else if (allCategoriesSelected || noSpecificCategorySelected) {
     console.log("用户选择了全部/未选特定科目大类，将尝试获取所有可用考试科目。");
     return []; // Signal to use all available exam subjects
  }
  
  // 警告日志
  console.warn(`部分选择的科目大类未能映射到具体科目名称，将尝试获取所有可用考试科目。用户选择: ${JSON.stringify(subjects)}`);
  return []; // Fallback to all subjects if mapping is incomplete for selections made
}; 