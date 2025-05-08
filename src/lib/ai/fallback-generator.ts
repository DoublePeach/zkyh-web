/**
 * @description 本地备选方案生成器 - 当AI API调用失败时使用
 * @author 郝桃桃
 * @date 2024-09-29
 */
import { SurveyFormData } from '@/types/survey';
import { AIResponseData } from './api-client';

// 最大每日规划生成天数（用于长期规划）
const MAX_DAILY_PLAN_DAYS = 30;

// 护理学科目映射关系
const NURSING_SUBJECTS = {
  BASIC: { id: 1, name: "基础知识" },
  RELATED: { id: 2, name: "相关专业知识" },
  PROFESSIONAL: { id: 3, name: "专业知识" },
  PRACTICAL: { id: 4, name: "专业实践能力" } // 重点关注的科目
};

// 专业实践能力科目的模块
const PRACTICAL_MODULES = [
  { title: '基本护理操作', description: '各类基础护理操作技术' },
  { title: '专科护理技能', description: '各专科常见疾病护理流程' },
  { title: '临床评估', description: '病情评估与风险预警能力' },
  { title: '应急处理', description: '突发情况和急救技能' },
  { title: '沟通技巧', description: '医患沟通与健康教育' },
  { title: '护理记录', description: '规范化的护理文件记录' },
  { title: '护理安全', description: '防范护理风险与安全管理' },
  { title: '健康宣教', description: '患者健康教育与指导' },
];

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
  
  // 优先识别"专业实践能力"科目
  const practicalSubject = examSubjects.find(s => s.id === 4) || NURSING_SUBJECTS.PRACTICAL;
  console.log('识别到的专业实践能力科目:', practicalSubject);
  
  // 优先识别"基础护理学"学科
  const basicNursingDiscipline = nursingDisciplines.find(d => d.id === 4) || { id: 4, name: '基础护理学' };
  console.log('识别到的基础护理学科:', basicNursingDiscipline);
  
  // 获取职称级别
  const titleLevel = surveyData.titleLevel === 'junior' ? '初级护师' : 
                    surveyData.titleLevel === 'mid' ? '主管护师' : 
                    surveyData.otherTitleLevel || '护士';
  
  // 计算各阶段天数
  const phase1Days = Math.floor(daysUntilExam * 0.4);
  const phase2Days = Math.floor(daysUntilExam * 0.3);
  const phase3Days = daysUntilExam - phase1Days - phase2Days;
  
  // 创建暖心陪伴风格的总览文字
  const overviewText = `亲爱的备考小伙伴，看到你为${titleLevel}考试制定的学习计划，我感到非常欣慰。距离考试还有${daysUntilExam}天，我们有充足的时间一步步打好基础。接下来的${phase1Days}天，我们将一起探索基础护理学的奥秘，逐步构建你的专业知识体系。记住，每一步的努力都是向着目标迈进的重要一步，相信自己，你可以的！`;
  
  // 创建阶段（包含长期规划特有的monthlyPlan字段）
  const phases = [
    {
      id: 1,
      name: "基础学习阶段",
      description: `在这个阶段，我们将一起打下坚实的基础。虽然内容可能有些多，但别担心，我们会一步步来。完成这个阶段后，你会对护理学有一个全面的认识，为接下来的学习打下坚实的基础。`,
      startDay: 1,
      endDay: phase1Days,
      focusAreas: ["基础护理操作", "护理基础理论", "健康评估方法", "临床思维培养"],
      learningGoals: [
        "掌握初级护师四个科目的基础知识框架",
        "重点学习基础护理学各章节内容",
        "熟悉专业实践能力考核要点和护理操作规范"
      ],
      recommendedResources: nursingDisciplines.length > 0 
        ? [basicNursingDiscipline.name, "专业实践技能操作规范", "基础护理学习题集"] 
        : ["基础护理学", "护理学基础", "专业实践技能操作规范"],
      monthlyPlan: isLongTermPlan ? `第1-${Math.min(30, phase1Days)}天：我们将重点学习基础护理学内容，这是打好基础的关键部分
第${Math.min(31, phase1Days + 1)}-${Math.min(60, phase1Days)}天：我们会系统学习专业实践能力相关知识，这些会让你的护理技能更加扎实
第${Math.min(61, phase1Days + 1)}天及以后：我们会兼顾其他三个科目的基础内容，全面提升你的知识结构` : undefined
    },
    {
      id: 2,
      name: "重点强化阶段",
      description: `这个阶段我们将进一步深入学习，巩固基础阶段的收获。可能会遇到一些挑战，但这正是你成长的机会！通过这个阶段的学习，你的专业实践能力将有质的飞跃，对临床问题的思考会更加全面。`,
      startDay: phase1Days + 1,
      endDay: phase1Days + phase2Days,
      focusAreas: ["专科护理操作", "临床案例分析", "难点知识攻克", "护理评估方法"],
      learningGoals: [
        "熟练掌握专业实践能力的核心操作技能",
        "提高临床思维和分析能力",
        "巩固基础护理学的重点和难点",
        "兼顾其他三个科目的重要内容"
      ],
      recommendedResources: nursingDisciplines.length > 0
        ? [practicalSubject.name + "训练指南", basicNursingDiscipline.name + "重点讲解", "临床案例分析集"]
        : ["专业实践能力训练指南", "基础护理学重点讲解", "初级护师考点精讲"],
      monthlyPlan: isLongTermPlan ? `第1-30天：我们将一起强化专业实践能力的重点内容，这会让你的专业技能更扎实
第31-60天：我们会进行各类护理操作练习和案例分析，提升你的实际应用能力
第61天及以后：我们将整合知识点，帮你形成完整的知识体系，你会感到知识之间的联系更加紧密` : undefined
    },
    {
      id: 3,
      name: "模拟冲刺阶段",
      description: `进入最后冲刺阶段啦！我们将通过大量的模拟练习和真题演练，巩固你的所学知识。相信经过前面的努力，你已经具备了扎实的基础，这个阶段将帮助你把知识转化为能力，以最佳状态迎接考试！`,
      startDay: phase1Days + phase2Days + 1,
      endDay: daysUntilExam,
      focusAreas: ["模拟考试训练", "实操演练", "要点总结", "答题技巧"],
      learningGoals: [
        "通过模拟测试熟悉考试题型和流程",
        "提高专业实践操作的准确性和规范性",
        "强化记忆重点知识点和考试要点",
        "培养良好的应试心态和时间管理能力"
      ],
      recommendedResources: ["历年真题集", "专业实践操作视频库", "四科要点速记手册", "模拟试卷"],
      monthlyPlan: isLongTermPlan ? `第1-30天：我们开始做专项模拟题，查漏补缺，这会让你对自己的薄弱环节有清晰认识
考前1个月：我们进行全科目模拟测试和专业实践模拟演练，让你熟悉考试节奏
考前2周：我们集中复习重点内容，调整心态，你会感到信心满满` : undefined
    }
  ];
  
  // 生成每日计划（只生成指定天数）
  const dailyPlans = [];
  
  // 获取所有可用科目，并确保专业实践能力科目排在前面
  const allSubjects = examSubjects.length > 0 
    ? [
        practicalSubject.name, // 确保专业实践能力科目排第一位
        ...examSubjects.filter(s => s.id !== 4).map(s => s.name)
      ]
    : [
        NURSING_SUBJECTS.PRACTICAL.name,
        NURSING_SUBJECTS.BASIC.name,
        NURSING_SUBJECTS.RELATED.name,
        NURSING_SUBJECTS.PROFESSIONAL.name
      ];
  
  // 准备基础护理学的章节
  let basicNursingChapters: string[] = [];
  
  // 尝试从学习资料中提取基础护理学的章节
  if (basicNursingDiscipline && nursingDisciplines.some(d => d.id === 4 && d.chapters && d.chapters.length > 0)) {
    const discipline = nursingDisciplines.find(d => d.id === 4);
    if (discipline && discipline.chapters) {
      basicNursingChapters = discipline.chapters.map(chapter => `${discipline.name}-${chapter.name}`);
    }
  }
  
  // 如果没有提取到章节，使用默认章节
  if (basicNursingChapters.length === 0) {
    basicNursingChapters = [
      "基础护理学-第一章：护理学基本概念",
      "基础护理学-第二章：护理程序",
      "基础护理学-第三章：医院环境与护理安全",
      "基础护理学-第四章：生命体征的评估与护理",
      "基础护理学-第五章：患者入院、转科与出院护理",
      "基础护理学-第六章：卧位与安全护理",
      "基础护理学-第七章：医院感染的预防与控制",
      "基础护理学-第八章：护理文件记录",
      "基础护理学-第九章：冷热疗法",
      "基础护理学-第十章：饮食与营养护理",
      "基础护理学-第十一章：排泄护理",
      "基础护理学-第十二章：给药护理",
      "基础护理学-第十三章：静脉输液护理"
    ];
  }
  
  // 生成专业实践能力的内容
  const practicalSkills = PRACTICAL_MODULES.flatMap(module => [
    `${module.title}-基本要点`,
    `${module.title}-操作流程`,
    `${module.title}-注意事项`
  ]);
  
  // 鼓励性的复习建议模板
  const reviewTipsTemplates = [
    "今天学习了不少内容，辛苦啦！建议休息片刻后，再用10分钟回顾今天的重点。记住，小步快跑比一次冲刺更有效！",
    "今天的内容很有趣，对吧？晚上睡前可以思考一下今天学到的知识点如何应用到临床实践中，这样记忆会更牢固哦！",
    "坚持就是胜利！今天的学习任务完成得很棒。建议用思维导图整理今天学到的知识，会对知识框架有更清晰的认识。",
    "护理学习需要理论结合实践。今天学完后，不妨找机会实际操作一下，或者观看相关视频，加深印象！",
    "今天内容有些挑战性，但你做得很好！记得经常复习，特别是那些感觉有点困难的部分，它们往往是考试重点。",
    "今天的学习为你的护理职业道路打下了坚实的一步。休息时可以想想这些知识如何让你成为更优秀的护理人员！"
  ];
  
  // 获取随机鼓励性复习建议
  function getRandomReviewTip(day: number): string {
    const baseIndex = day % reviewTipsTemplates.length;
    return reviewTipsTemplates[baseIndex];
  }
  
  // 为每一天生成计划 - 确保每天都有足够的学习任务
  for (let day = 1; day <= planGenerationDays; day++) {
    // 确定当前所属阶段
    let phaseId = 1;
    if (day > phase1Days + phase2Days) {
      phaseId = 3;
    } else if (day > phase1Days) {
      phaseId = 2;
    }
    
    // 是否是周末（为了变化学习内容和时长）
    const isWeekend = (day % 7 === 0) || ((day + 1) % 7 === 0);
    
    // 安排每日学习的科目：优先专业实践能力，其他科目轮换
    const subjects: string[] = [];
    
    // 专业实践能力科目总是第一位
    subjects.push(allSubjects[0]);
    
    // 添加其他轮换科目 - 每天增加到3-4个科目，提高多样性
    const otherSubjectIndex = ((day - 1) % (allSubjects.length - 1)) + 1;
    subjects.push(allSubjects[otherSubjectIndex]);
    
    // 添加第三个科目 - 每天都添加，不再每4天才添加
    const thirdSubjectIndex = ((day + 1) % (allSubjects.length - 1)) + 1;
    if (thirdSubjectIndex !== otherSubjectIndex && allSubjects.length > 2) {
      subjects.push(allSubjects[thirdSubjectIndex]);
    }
    
    // 添加第四个科目 - 每3天才添加，增加多样性
    if (day % 3 === 0 && allSubjects.length > 3) {
      const fourthSubjectIndex = ((day + 2) % (allSubjects.length - 1)) + 1;
      if (!subjects.includes(allSubjects[fourthSubjectIndex])) {
        subjects.push(allSubjects[fourthSubjectIndex]);
      }
    }
    
    // 生成任务
    const tasks = [];
    
    // 温馨的学习气氛描述
    const warmGreeting = isWeekend ? 
      "今天是周末，我们可以安排更多的学习时间，学习节奏可以更从容一些～" : 
      "今天我们继续前进，每天的进步积累起来就是最大的收获！";
    
    // 根据阶段生成任务
    if (phaseId === 1) {
      // 基础阶段任务 - 确保每天有4-6个任务
      
      // 1. 基础护理知识学习
      const chapterIndex = (day - 1) % basicNursingChapters.length;
      tasks.push({
        title: `探索${basicNursingChapters[chapterIndex]}`,
        description: `今天我们来探索基础护理学的精彩内容，系统学习${basicNursingChapters[chapterIndex]}，掌握核心概念和基本理论。`,
        duration: isWeekend ? 120 : 90,
        resources: [basicNursingChapters[chapterIndex], "基础护理学教材"],
        subject: "基础护理学"
      });
      
      // 2. 专业实践能力练习
      const skillIndex = (day - 1) % practicalSkills.length;
      tasks.push({
        title: `${practicalSkills[skillIndex]}学习`,
        description: `今天我们通过视频和模拟练习，学习专业实践能力中的${practicalSkills[skillIndex]}，一起掌握规范操作流程！`,
        duration: isWeekend ? 90 : 60,
        resources: [practicalSkills[skillIndex], "专业实践操作视频"],
        subject: "专业实践能力"
      });
      
      // 3. 实践技能应用
      tasks.push({
        title: "护理操作实战练习",
        description: "让我们将理论知识转化为实际操作能力，通过模型或情景模拟进行基础护理操作的练习。",
        duration: isWeekend ? 60 : 45,
        resources: ["护理操作指南", "操作技能视频"],
        subject: "专业实践能力"
      });
      
      // 4. 其他科目学习
      tasks.push({
        title: `${subjects[1]}初步探索`,
        description: `今天我们花点时间了解${subjects[1]}的基础知识，初步形成知识框架，后续会逐步深入学习。`,
        duration: isWeekend ? 60 : 40,
        resources: [`${subjects[1]}教材`, `${subjects[1]}基础知识点总结`],
        subject: subjects[1]
      });
      
      // 5. 基础护理学习题练习 - 新增任务
      tasks.push({
        title: "基础护理学习题练习",
        description: "通过做一些基础题目，巩固今天学习的内容，检验自己的掌握程度，发现需要加强的知识点。",
        duration: isWeekend ? 45 : 30,
        resources: ["基础护理学习题", "练习册"],
        subject: "基础护理学"
      });
      
      // 6. 第三个科目学习 - 新增任务
      if (subjects.length > 2) {
        tasks.push({
          title: `${subjects[2]}知识预习`,
          description: `今天我们简单了解一下${subjects[2]}的基本内容，对整体知识框架有个初步认识。`,
          duration: isWeekend ? 45 : 30,
          resources: [`${subjects[2]}学习指南`, `${subjects[2]}知识框架`],
          subject: subjects[2]
        });
      }
      
      // 周末额外学习任务
      if (isWeekend) {
        tasks.push({
          title: "本周知识整合",
          description: "周末是整合知识的好时机！让我们回顾本周学习的内容，用思维导图整理核心知识点，加深理解和记忆。",
          duration: 60,
          resources: ["思维导图工具", "本周学习笔记"],
          subject: "综合复习"
        });
      }
    } else if (phaseId === 2) {
      // 强化阶段任务 - 每天至少4个任务
      
      // 1. 专业实践能力强化
      const practicalSkillIndex = (day - phase1Days - 1) % practicalSkills.length;
      tasks.push({
        title: `${practicalSkills[practicalSkillIndex]}强化训练`,
        description: `今天我们将深入学习专业实践能力的${practicalSkills[practicalSkillIndex]}，重点掌握操作细节和技巧，提高规范性。`,
        duration: isWeekend ? 120 : 90,
        resources: [practicalSkills[practicalSkillIndex], "专业操作技能训练指南"],
        subject: "专业实践能力"
      });
      
      // 2. 临床案例分析
      tasks.push({
        title: "临床案例分析与讨论",
        description: "今天我们通过分析典型护理案例，加深对专业实践能力的理解，学习如何在临床中灵活应用所学知识。",
        duration: isWeekend ? 90 : 60,
        resources: ["临床案例分析", "护理病例讨论"],
        subject: "专业实践能力"
      });
      
      // 3. 基础护理学强化
      const nursingChapterIndex = ((day - phase1Days - 1) % basicNursingChapters.length);
      tasks.push({
        title: `${basicNursingChapters[nursingChapterIndex]}难点突破`,
        description: `今天我们将攻克${basicNursingChapters[nursingChapterIndex]}中的重点难点内容，巩固基础知识。`,
        duration: isWeekend ? 70 : 50,
        resources: ["基础护理学重点讲解", "难点解析"],
        subject: "基础护理学"
      });
      
      // 4. 其他科目任务
      tasks.push({
        title: `${subjects[1]}重点突破`,
        description: `今天我们针对${subjects[1]}的重点和难点进行强化学习，加深理解和记忆。`,
        duration: isWeekend ? 60 : 45,
        resources: [`${subjects[1]}重点讲解`, `${subjects[1]}习题集`],
        subject: subjects[1]
      });
      
      // 5. 知识点串联
      tasks.push({
        title: "知识整合与串联",
        description: "今天我们尝试将不同科目的知识点进行整合串联，建立知识体系，提升理解深度。",
        duration: isWeekend ? 50 : 30,
        resources: ["思维导图", "知识点关联图"],
        subject: "知识整合"
      });
      
      // 6. 周末模拟测试
      if (isWeekend) {
        tasks.push({
          title: "阶段性模拟测试",
          description: "周末进行一次阶段性的模拟测试，检验学习成果，发现需要加强的知识点。",
          duration: 90,
          resources: ["阶段测试题", "知识点检测表"],
          subject: "综合测试"
        });
      }
    } else {
      // 冲刺阶段任务 - 每天至少4个任务
      
      // 1. 专业实践能力模拟测试
      tasks.push({
        title: "专业实践能力模拟测试",
        description: "今天我们模拟专业实践能力的考核形式，通过实战练习提升操作的规范性和熟练度。",
        duration: isWeekend ? 120 : 90,
        resources: ["专业实践能力模拟题", "操作技能评分标准"],
        subject: "专业实践能力"
      });
      
      // 2. 基础护理学重点复习
      tasks.push({
        title: "基础护理学重点复习",
        description: "今天我们系统复习基础护理学的重点内容和易错点，通过专项练习巩固掌握程度。",
        duration: isWeekend ? 90 : 60,
        resources: ["基础护理学考点精讲", "护理操作要点速记"],
        subject: "基础护理学"
      });
      
      // 3. 综合案例分析
      tasks.push({
        title: "综合护理案例分析",
        description: "今天我们通过综合案例分析，提升临床思维和问题解决能力，将知识融会贯通。",
        duration: isWeekend ? 70 : 50,
        resources: ["综合案例集", "临床思维训练"],
        subject: "专业实践能力"
      });
      
      // 4. 错题专项训练
      tasks.push({
        title: "错题专项训练",
        description: "今天我们针对前期练习中的错题进行专项训练，查漏补缺，强化薄弱环节。",
        duration: isWeekend ? 60 : 45,
        resources: ["错题集", "重点解析"],
        subject: "专项训练"
      });
      
      // 周末全科模拟或平日科目复习
      if (isWeekend) {
        // 5. 四科综合模拟考试
        tasks.push({
          title: "四科综合模拟考试",
          description: "周末进行一次全面的四科综合模拟考试，模拟真实考试环境和时间限制，全面检验备考成果。",
          duration: 180,
          resources: ["初级护师全真模拟试卷", "历年真题解析"],
          subject: "综合模拟"
        });
      } else {
        // 5. 平日其他科目复习
        tasks.push({
          title: `${subjects[1]}要点突破`,
          description: `今天我们重点复习${subjects[1]}的核心考点和答题技巧，强化记忆重点内容。`,
          duration: 45,
          resources: [`${subjects[1]}考点精讲`, "答题技巧指导"],
          subject: subjects[1]
        });
      }
      
      // 6. 心态调整
      tasks.push({
        title: "备考心态调整",
        description: "冲刺阶段保持良好心态很重要！今天我们花点时间放松心情，调整状态，为最后冲刺做好准备。",
        duration: 30,
        resources: ["心理调适指南", "放松训练音频"],
        subject: "心态调整"
      });
    }
    
    // 生成当天计划 - 添加暖心鼓励的复习建议
    dailyPlans.push({
      day,
      date: formatDate(day - 1),
      phaseId,
      title: `${formatDate(day - 1).slice(5).replace('-', '月')}日 · ${phaseId === 1 ? '探索' : phaseId === 2 ? '深入' : '强化'}${subjects[0]}的第${phaseId === 1 ? day : phaseId === 2 ? (day - phase1Days) : (day - phase1Days - phase2Days)}天`,
      subjects,
      tasks,
      reviewTips: `${getRandomReviewTip(day)} ${isWeekend ? '周末是整合所学内容的好时机，建议对一周所学进行系统梳理。' : '今天学习了不少内容，别给自己太大压力，稳步前进就是最好的！'}`
    });
  }
  
  // 添加对长期规划的后续步骤建议（仅长期规划需要）
  const nextSteps = isLongTermPlan ? 
    `完成前${planGenerationDays}天学习后，建议：
1. 对专业实践能力的学习进度进行评估，特别关注基础护理学的掌握程度
2. 进行一次针对专业实践能力的模拟测试，找出薄弱环节
3. 结合其他三个科目的学习情况，合理调整后续学习重点
4. 根据实际情况适当调整专业实践能力与其他科目的学习时间比例（建议维持7:3左右）
5. 后续学习计划可根据薄弱环节进行针对性调整，但始终保持专业实践能力为学习重点` : undefined;
  
  // 返回完整的备考规划（添加长期规划特有字段）
  return {
    overview: overviewText,
    phases,
    dailyPlans,
    ...(isLongTermPlan && { nextSteps })
  };
} 