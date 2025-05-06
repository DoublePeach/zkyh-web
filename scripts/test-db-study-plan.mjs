/**
 * @description 测试基于数据库生成备考规划
 * @author 郝桃桃
 * @date 2024-08-05
 */

// 直接使用相对路径引入 ESM 模块
import { Pool } from 'pg';
import { DB_CONFIG } from '../src/lib/config.js';

// 创建数据库连接池
const pool = new Pool({ connectionString: DB_CONFIG.PG_CONNECTION_STRING });

// 模拟调查问卷数据
const mockSurveyData = {
  profession: 'nursing',
  titleLevel: 'junior', // 初级护师
  examStatus: 'first', // 首次参加考试
  overallLevel: 'medium', // 有一定基础
  subjectLevels: {
    basic: 'medium',
    related: 'medium',
    professional: 'weak',
    practical: 'medium'
  },
  subjects: {
    basic: true,
    related: true,
    professional: true,
    practical: true
  },
  weekdaysCount: '3-4', // 每周3-4天
  weekdayHours: '1-2', // 工作日1-2小时
  weekendHours: '3-4', // 周末3-4小时
  examYear: '2025', // 考试年份
  otherTitleLevel: '' // 其他职称（不适用）
};

/**
 * @description 从数据库获取所有考试科目
 * @returns {Promise<Array>} 考试科目列表
 */
async function fetchExamSubjects() {
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
 * @description 从数据库获取所有护理学科
 * @returns {Promise<Array>} 护理学科列表
 */
async function fetchNursingDisciplines() {
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
 * @returns {Promise<Array>} 章节列表
 */
async function fetchChaptersByDiscipline(disciplineId) {
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
 * @returns {Promise<Array>} 所有章节列表
 */
async function fetchAllChapters() {
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
 * @returns {Promise<Array>} 题库列表
 */
async function fetchTestBanksBySubject(subjectId) {
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
 * @returns {Promise<Array>} 所有题库列表
 */
async function fetchAllTestBanks() {
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
 * @returns {Promise<Object>} 包含所有学习资料的数据结构
 */
async function buildLearningMaterialsData() {
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

async function testFetchData() {
  console.log('开始测试从数据库获取学习资料...');
  
  try {
    // 获取学习资料
    const learningMaterials = await buildLearningMaterialsData();
    
    // 输出概述信息
    console.log(`成功获取学习资料:` +
      `\n- 考试科目数量: ${learningMaterials.examSubjects.length}` +
      `\n- 护理学科数量: ${learningMaterials.nursingDisciplines.length}`
    );
    
    // 输出考试科目详情
    console.log('\n考试科目详情:');
    learningMaterials.examSubjects.forEach(subject => {
      console.log(`- ${subject.name} (ID: ${subject.id})`);
      console.log(`  描述: ${subject.description}`);
      console.log(`  题库数量: ${subject.testBanks.length}`);
      console.log(`  相关护理学科: ${subject.relatedDisciplines.map(d => d.name).join(', ')}`);
      
      if (subject.testBanks.length > 0) {
        console.log('  题库示例:');
        subject.testBanks.slice(0, 2).forEach(bank => {
          console.log(`    * ${bank.name} (${bank.type})`);
        });
      }
      console.log('');
    });
    
    // 输出护理学科详情
    console.log('\n护理学科详情:');
    learningMaterials.nursingDisciplines.forEach(discipline => {
      console.log(`- ${discipline.name} (ID: ${discipline.id})`);
      console.log(`  描述: ${discipline.description}`);
      console.log(`  章节数量: ${discipline.chapters.length}`);
      
      if (discipline.chapters.length > 0) {
        console.log('  章节示例:');
        discipline.chapters.slice(0, 3).forEach(chapter => {
          console.log(`    * ${chapter.name} (序号: ${chapter.order_index})`);
          console.log(`      描述: ${chapter.description.substring(0, 100)}${chapter.description.length > 100 ? '...' : ''}`);
        });
      }
      console.log('');
    });
    
    // 保存到文件
    const fs = await import('fs');
    fs.writeFileSync('learning-materials.json', JSON.stringify(learningMaterials, null, 2));
    console.log('学习资料已保存到 learning-materials.json 文件\n');
    
    return learningMaterials;
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    // 关闭连接池
    await pool.end();
    console.log('数据库连接已关闭');
  }
}

// 执行测试
testFetchData(); 