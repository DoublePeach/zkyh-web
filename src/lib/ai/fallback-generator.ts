/**
 * @description 本地备选方案生成器 - 当AI API调用失败时使用
 * @author 郝桃桃
 * @date 2024-09-29
 */
import { SurveyFormData } from '@/types/survey';
import { AIResponseData } from './api-client';

// 最大每日规划生成天数（用于长期规划）
const MAX_DAILY_PLAN_DAYS = 30;

/**
 * @description 生成护理学习模块列表
 * @returns {Array<{title: string, description: string}>} 模块列表
 */
function getNursingModules(): Array<{title: string, description: string}> {
  return [
    { title: '护理学基础', description: '核心护理概念和基本理论' },
    { title: '健康评估', description: '全面的患者评估技能与方法' },
    { title: '内科护理学', description: '内科疾病的护理知识与技能' },
    { title: '外科护理学', description: '外科疾病与手术护理' },
    { title: '妇产科护理学', description: '妇女保健与产科护理' },
    { title: '儿科护理学', description: '儿童生长发育与疾病护理' },
    { title: '急危重症护理', description: '急危重症患者的护理与抢救' },
    { title: '老年护理学', description: '老年人健康特点与护理' },
    { title: '药理学基础', description: '药物作用机制与应用' },
    { title: '护理管理', description: '护理质量与安全管理' }
  ];
}

/**
 * @description 生成日期字符串
 * @param {number} dayOffset - 距今天的偏移天数
 * @returns {string} 日期字符串 (YYYY-MM-DD)
 */
function formatDate(dayOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString().split('T')[0]; // 格式：YYYY-MM-DD
}

/**
 * @description 生成本地备考规划数据
 * @param {SurveyFormData} surveyData - 调查问卷数据
 * @param {any} learningMaterials - 学习资料数据（可能为空）
 * @param {number} daysUntilExam - 距离考试的天数
 * @returns {AIResponseData} 本地生成的备考规划数据
 */
export function generateLocalStudyPlan(
  surveyData: SurveyFormData, 
  learningMaterials: any, 
  daysUntilExam: number
): AIResponseData {
  console.log('使用本地生成方案创建备考规划...');
  
  // 判断是否是长期规划（超过MAX_DAILY_PLAN_DAYS天）
  const isLongTermPlan = daysUntilExam > MAX_DAILY_PLAN_DAYS;
  const planGenerationDays = isLongTermPlan ? MAX_DAILY_PLAN_DAYS : daysUntilExam;
  
  console.log(`本地生成方案: 总备考时间${daysUntilExam}天，${isLongTermPlan ? `将只生成近${planGenerationDays}天的详细规划` : '将生成完整的每日规划'}`);
  
  // 获取可用的资源数据
  const examSubjects: Array<{id: number; name: string; description?: string}> = 
    learningMaterials?.examSubjects || [];
  const nursingDisciplines: Array<{id: number; name: string; description?: string; chapters?: any[]}> = 
    learningMaterials?.nursingDisciplines || [];
  
  // 获取职称级别
  const titleLevel = surveyData.titleLevel === 'junior' ? '初级护师' : 
                    surveyData.titleLevel === 'mid' ? '主管护师' : 
                    surveyData.otherTitleLevel || '护士';
  
  // 计算各阶段天数
  const phase1Days = Math.floor(daysUntilExam * 0.4);
  const phase2Days = Math.floor(daysUntilExam * 0.3);
  const phase3Days = daysUntilExam - phase1Days - phase2Days;
  
  // 创建阶段（包含长期规划特有的monthlyPlan字段）
  const phases = [
    {
      id: 1,
      name: "基础学习阶段",
      description: `此阶段重点掌握${titleLevel}考试的基础知识点，建立知识框架。为期${phase1Days}天，系统学习基础理论。`,
      startDay: 1,
      endDay: phase1Days,
      focusAreas: ["基础医学知识", "护理基础理论", "基本操作技能"],
      learningGoals: [
        "建立完整的护理知识框架",
        "掌握基础医学和护理学核心概念",
        "熟悉主要考试科目的核心内容"
      ],
      recommendedResources: examSubjects.slice(0, 3).map(s => s.name).length > 0 
        ? examSubjects.slice(0, 3).map(s => s.name) 
        : ["基础医学", "护理学基础", "内科护理学"],
      monthlyPlan: isLongTermPlan ? `第1-${Math.min(30, phase1Days)}天：系统学习基础概念和理论
第${Math.min(31, phase1Days + 1)}-${Math.min(60, phase1Days)}天：完成核心章节学习
第${Math.min(61, phase1Days + 1)}天及以后：巩固基础知识，开始涉及进阶内容` : undefined
    },
    {
      id: 2,
      name: "重点强化阶段",
      description: `此阶段针对${titleLevel}考试的难点内容进行强化学习，加深理解。为期${phase2Days}天，重点攻克疑难知识点。`,
      startDay: phase1Days + 1,
      endDay: phase1Days + phase2Days,
      focusAreas: ["重点章节", "难点知识", "临床应用案例"],
      learningGoals: [
        "攻克学习难点",
        "加深对核心知识的理解",
        "提高知识应用能力"
      ],
      recommendedResources: nursingDisciplines.slice(0, 3).map(d => d.name).length > 0
        ? nursingDisciplines.slice(0, 3).map(d => d.name)
        : ["内科护理学", "外科护理学", "妇产科护理学"],
      monthlyPlan: isLongTermPlan ? `第1-30天：针对性学习难点章节
第31-60天：强化专业课程学习
第61天及以后：开始结合习题进行知识应用` : undefined
    },
    {
      id: 3,
      name: "模拟冲刺阶段",
      description: `此阶段以${titleLevel}考试模拟训练和真题练习为主，查漏补缺。为期${phase3Days}天，着重提高应试能力。`,
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
  
  // 如果没有可用资源数据，使用默认模块
  const nursingModules = getNursingModules();
  
  // 抽取可用的学习材料
  const availableSubjects = examSubjects.map(s => s.name).length > 0
    ? examSubjects.map(s => s.name)
    : nursingModules.map(m => m.title);
  
  const availableChapters: string[] = [];
  
  // 尝试从学习资料中提取章节
  if (nursingDisciplines.length > 0 && nursingDisciplines.some(d => d.chapters && d.chapters.length > 0)) {
    nursingDisciplines.forEach(discipline => {
      if (discipline.chapters && discipline.chapters.length > 0) {
        discipline.chapters.forEach(chapter => {
          availableChapters.push(`${discipline.name}-${chapter.name}`);
        });
      }
    });
  } else {
    // 使用默认章节
    availableSubjects.forEach(subject => {
      availableChapters.push(`${subject}-第一章：基础理论`);
      availableChapters.push(`${subject}-第二章：核心概念`);
      availableChapters.push(`${subject}-第三章：实践应用`);
    });
  }
  
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
    
    // 是否是周末（为了变化学习内容和时长）
    const isWeekend = (day % 7 === 0) || ((day + 1) % 7 === 0);
    
    // 添加科目（根据阶段不同选择不同科目）
    if (availableSubjects.length > 0) {
      const subjectIndex = (day - 1) % availableSubjects.length;
      subjects.push(availableSubjects[subjectIndex]);
      if (isWeekend && availableSubjects.length > 1) {
        // 周末多学一个科目
        const nextIndex = (subjectIndex + 1) % availableSubjects.length;
        subjects.push(availableSubjects[nextIndex]);
      }
    }
    
    // 默认主科目
    const mainSubject = subjects[0] || '护理学基础';
    
    // 生成任务
    if (phaseId === 1) {
      // 基础阶段任务
      tasks.push({
        title: `学习${mainSubject}的核心概念`,
        description: `系统学习${mainSubject}的基本理论和核心概念，建立知识框架`,
        duration: isWeekend ? 120 : 90, // 周末学习时间更长
        resources: availableChapters.filter(c => c.includes(mainSubject)).slice(0, 2)
      });
      tasks.push({
        title: "课后习题练习",
        description: "完成相关章节的课后习题，巩固所学内容",
        duration: isWeekend ? 90 : 60,
        resources: [`${mainSubject}课后习题集`]
      });
      
      // 周末额外任务
      if (isWeekend && subjects.length > 1) {
        tasks.push({
          title: `${subjects[1]}预习`,
          description: `预习${subjects[1]}的基础内容，了解核心概念`,
          duration: 60,
          resources: availableChapters.filter(c => c.includes(subjects[1])).slice(0, 1)
        });
      }
    } else if (phaseId === 2) {
      // 强化阶段任务
      tasks.push({
        title: `${mainSubject}重点内容学习`,
        description: `深入学习${mainSubject}的重点和难点内容，加强理解`,
        duration: isWeekend ? 120 : 90,
        resources: availableChapters.filter(c => c.includes(mainSubject)).slice(0, 2)
      });
      tasks.push({
        title: "案例分析练习",
        description: "通过典型案例加深对知识点的理解和应用",
        duration: isWeekend ? 90 : 60,
        resources: [`${mainSubject}典型案例集`]
      });
      
      // 周末额外任务
      if (isWeekend) {
        tasks.push({
          title: "知识点整合复习",
          description: "将近期学习的多个科目知识点进行整合，形成知识网络",
          duration: 60,
          resources: ["综合知识点梳理"]
        });
      }
    } else {
      // 冲刺阶段任务
      tasks.push({
        title: "模拟试题练习",
        description: `完成一套${titleLevel}完整的模拟试题，掌握答题技巧`,
        duration: isWeekend ? 120 : 90,
        resources: ["模拟试卷", "历年真题"]
      });
      tasks.push({
        title: `${mainSubject}重点知识回顾`,
        description: `回顾${mainSubject}的易错和重点知识点，查漏补缺`,
        duration: isWeekend ? 90 : 60,
        resources: [`${mainSubject}知识点总结`, "考点精讲"]
      });
      
      // 周末额外任务
      if (isWeekend) {
        tasks.push({
          title: "模拟考试训练",
          description: "模拟真实考试环境，进行全科目、限时模拟考试训练",
          duration: 120,
          resources: ["全真模拟试卷"]
        });
      }
    }
    
    // 生成当天计划
    dailyPlans.push({
      day,
      date: formatDate(day - 1),
      phaseId,
      title: `第${day}天学习计划`,
      subjects,
      tasks,
      reviewTips: `在今天学习结束后，花15分钟回顾${subjects.join('和')}的核心概念，确保知识点能够串联起来。${isWeekend ? '周末可以适当增加复习时间，对一周所学内容进行总结。' : ''}`
    });
  }
  
  // 添加对长期规划的后续步骤建议（仅长期规划需要）
  const nextSteps = isLongTermPlan ? 
    `完成前${planGenerationDays}天学习后，建议：
1. 评估学习进度和掌握程度
2. 进行一次阶段性测试，找出薄弱环节
3. 结合测试结果，重新规划下一阶段的学习内容
4. 调整学习方法和时间分配，确保学习效率
5. 根据实际进度适当调整各阶段的时间比例` : undefined;
  
  // 返回完整的备考规划（添加长期规划特有字段）
  return {
    overview: `这份备考规划基于您的${titleLevel}备考需求制定，结合您的学习基础和可用时间，将${daysUntilExam}天的备考时间分为基础、强化和冲刺三个阶段。每个阶段设置了不同的学习重点和目标，并提供了详细的每日学习计划。${isLongTermPlan ? `鉴于备考时间较长，目前仅提供近${planGenerationDays}天的详细规划，之后可根据学习进度进行调整。` : ''}建议您严格按照计划执行，合理安排时间，定期复习，确保学习效果。`,
    phases,
    dailyPlans,
    ...(isLongTermPlan && { nextSteps })
  };
} 