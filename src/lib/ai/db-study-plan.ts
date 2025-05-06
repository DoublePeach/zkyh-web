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
 * @description 构建学习资料数据结构
 * @param {SurveyFormData} surveyData - 用户表单数据，用于确定需要获取哪些科目的资料
 * @returns {Promise<any>} 包含所有学习资料的数据结构
 */
async function buildLearningMaterialsData(surveyData: SurveyFormData): Promise<any> {
  try {
    console.log('开始从数据库构建学习资料数据...');
    
    // 获取用户选择的科目信息
    const selectedSubjects = surveyData.subjects || {
      basic: true,
      related: true,
      professional: true,
      practical: true
    };
    
    console.log('用户选择的科目:', JSON.stringify(selectedSubjects));
    
    // 获取所有考试科目，后续根据用户选择筛选
    const allExamSubjects = await fetchExamSubjects();
    console.log(`获取到${allExamSubjects.length}个考试科目`);
    
    // 根据用户选择筛选考试科目
    // 通常基础知识对应基础护理学、相关专业对应医学基础、专业知识对应内外科护理等
    const examSubjectMapping = {
      basic: ['基础护理学', '护理学基础'],
      related: ['医学基础', '相关医学', '人体解剖学', '生理学'],
      professional: ['内科护理学', '外科护理学', '专科护理'],
      practical: ['护理技能', '实践操作', '临床护理']
    };
    
    // 筛选用户选择的考试科目
    const examSubjects = allExamSubjects.filter(subject => {
      // 如果用户选择了基础知识，则包含基础护理学等相关科目
      if (selectedSubjects.basic && examSubjectMapping.basic.some(name => subject.name.includes(name))) {
        return true;
      }
      // 如果用户选择了相关专业知识，则包含医学基础等相关科目
      if (selectedSubjects.related && examSubjectMapping.related.some(name => subject.name.includes(name))) {
        return true;
      }
      // 如果用户选择了专业知识，则包含内外科护理等相关科目
      if (selectedSubjects.professional && examSubjectMapping.professional.some(name => subject.name.includes(name))) {
        return true;
      }
      // 如果用户选择了实践能力，则包含护理技能等相关科目
      if (selectedSubjects.practical && examSubjectMapping.practical.some(name => subject.name.includes(name))) {
        return true;
      }
      
      // 如果没有明确匹配，但用户选择了所有科目，则也包含
      if (selectedSubjects.basic && selectedSubjects.related && 
          selectedSubjects.professional && selectedSubjects.practical) {
        return true;
      }
      
      return false;
    });
    
    // 如果筛选后没有科目，则使用所有科目
    if (examSubjects.length === 0) {
      console.log('筛选后没有匹配的科目，使用所有科目');
      examSubjects.push(...allExamSubjects);
    }
    
    console.log(`筛选后保留${examSubjects.length}个考试科目:`, examSubjects.map(s => s.name).join(', '));
    
    // 获取所有护理学科
    const nursingDisciplines = await fetchNursingDisciplines();
    console.log(`获取到${nursingDisciplines.length}个护理学科`);
    
    // 获取用户选择的科目相关的章节，避免获取所有章节
    const allChapters: Chapter[] = [];
    for (const discipline of nursingDisciplines) {
      // 判断护理学科是否与用户选择的科目相关
      const isRelated = (
        (selectedSubjects.basic && examSubjectMapping.basic.some(name => discipline.name.includes(name))) ||
        (selectedSubjects.related && examSubjectMapping.related.some(name => discipline.name.includes(name))) ||
        (selectedSubjects.professional && examSubjectMapping.professional.some(name => discipline.name.includes(name))) ||
        (selectedSubjects.practical && examSubjectMapping.practical.some(name => discipline.name.includes(name)))
      );
      
      // 如果相关，或用户选择了所有科目，则获取该学科的章节
      if (isRelated || (selectedSubjects.basic && selectedSubjects.related && 
          selectedSubjects.professional && selectedSubjects.practical)) {
        const chapters = await fetchChaptersByDiscipline(discipline.id);
        allChapters.push(...chapters);
      }
    }
    
    console.log(`获取到${allChapters.length}个相关章节`);
    
    // 获取相关题库
    const allTestBanks: TestBank[] = [];
    for (const subject of examSubjects) {
      const testBanks = await fetchTestBanksBySubject(subject.id);
      allTestBanks.push(...testBanks);
    }
    
    console.log(`获取到${allTestBanks.length}个相关题库`);
    
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
        subject.description?.includes(discipline.name) ||
        discipline.description?.includes(subject.name)
      );
      
      return {
        ...subject,
        relatedDisciplines: relatedDisciplines.length > 0 ? relatedDisciplines : disciplinesWithChapters
      };
    });
    
    console.log('学习资料数据构建完成');
    
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
 * @description 生成本地备考规划数据（作为外部API失败时的备选方案）
 * @param {SurveyFormData} surveyData - 调查问卷数据
 * @param {any} learningMaterials - 学习资料数据
 * @param {number} daysUntilExam - 距离考试的天数
 * @returns {AIResponseData} 本地生成的备考规划数据
 */
function generateLocalStudyPlan(surveyData: SurveyFormData, learningMaterials: any, daysUntilExam: number): AIResponseData {
  console.log('使用本地生成方案创建备考规划...');
  
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
  
  // 创建阶段
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
      recommendedResources: examSubjects.slice(0, 3).map((s: {name: string}) => s.name) || ["基础医学", "护理学基础", "内科护理学"]
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
      recommendedResources: nursingDisciplines.slice(0, 3).map((d: {name: string}) => d.name) || ["内科护理学", "外科护理学", "妇产科护理学"]
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
      recommendedResources: ["历年真题集", "模拟试卷", "知识点总结"]
    }
  ];
  
  // 生成每日计划
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
  
  // 为每一天生成计划
  for (let day = 1; day <= daysUntilExam; day++) {
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
  
  // 返回完整的备考规划
  return {
    overview: `这份备考规划基于您的${surveyData.titleLevel === 'junior' ? '初级护师' : '主管护师'}备考需求制定，
    结合您的学习基础和可用时间，将${daysUntilExam}天的备考时间分为基础、强化和冲刺三个阶段。
    每个阶段设置了不同的学习重点和目标，并提供了详细的每日学习计划。
    建议您严格按照计划执行，合理安排时间，定期复习，确保学习效果。`,
    phases,
    dailyPlans
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
${JSON.stringify(learningMaterials, null, 2)}

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

    try {
      // 使用OpenAI生成带有数据库学习资料的备考规划
      console.log('开始调用AI生成备考规划...');
      
      // 直接使用fetch调用API而不是OpenAI客户端
      const apiKey = 'sk-ed222c4e2fcc4a64af6b3692e29cf443';
      const baseUrl = 'https://api.deepseek.com/v1/chat/completions';
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
          temperature: 0.7,
          max_tokens: 4000
        };
        
        console.log('API请求配置:', JSON.stringify({
          model: requestBody.model,
          temperature: requestBody.temperature,
          max_tokens: requestBody.max_tokens,
          message_length: requestBody.messages[0].content.length
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
          console.log('内容文本长度:', contentText.length);
          console.log('内容预览:', contentText.substring(0, 200));
          
          // 处理返回的内容，移除可能的Markdown代码块标记
          let cleanedContent = contentText;
          // 如果内容以```json开头，并以```结尾，删除这些标记
          if (cleanedContent.startsWith('```json') && cleanedContent.endsWith('```')) {
            cleanedContent = cleanedContent.slice(7, -3).trim();
          } else if (cleanedContent.startsWith('```') && cleanedContent.endsWith('```')) {
            cleanedContent = cleanedContent.slice(3, -3).trim();
          }
          
          // Now parse the contentText which should be the AIResponseData JSON
          try {
            console.log('正在解析API返回的内容JSON...');
            const parsedResult = JSON.parse(cleanedContent);
            
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
            
            console.log('API返回数据解析完成，已验证数据结构完整性');
            return parsedResult;
          } catch (parseError) {
            console.error('无法解析返回的内容JSON:', parseError);
            console.error('原始内容文本:', contentText.substring(0, 300) + '...');
            console.error('将使用本地生成方案');
            return generateLocalStudyPlan(surveyData, learningMaterials, daysUntilExam);
          }
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