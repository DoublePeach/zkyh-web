/**
 * @description 测试MCP Server连接和数据库访问
 * @author 郝桃桃
 * @date 2024-08-24
 */

// 切换为ESM模块导入
import { 
  listMCPTools, 
  executeQuery, 
  listTables, 
  fetchExamSubjects, 
  fetchChapters 
} from '../src/lib/ai/postgres-mcp.js';

import { DB_CONFIG } from '../src/lib/config.js';

async function testMCPConnection() {
  console.log('=== 测试MCP Server连接 ===');
  console.log('数据库连接字符串:', DB_CONFIG.PG_CONNECTION_STRING);
  
  try {
    console.log('\n1. 测试可用工具列表...');
    const tools = await listMCPTools();
    console.log('可用工具列表:', tools.join(', '));
    
    console.log('\n2. 测试列出数据表...');
    const tables = await listTables();
    console.log('数据表列表:', tables.join(', '));
    
    console.log('\n3. 测试获取考试学科...');
    const subjects = await fetchExamSubjects();
    console.log(`共找到 ${subjects.length} 个考试学科:`);
    subjects.forEach((subject, index) => {
      console.log(`  ${index + 1}. ${subject.name}: ${subject.description}`);
    });
    
    if (subjects.length > 0) {
      console.log('\n4. 测试获取章节 (使用第一个学科)...');
      const chapters = await fetchChapters(subjects[0].id);
      console.log(`学科 "${subjects[0].name}" 共有 ${chapters.length} 个章节:`);
      chapters.slice(0, 5).forEach((chapter, index) => {
        console.log(`  ${index + 1}. ${chapter.name}`);
      });
      
      if (chapters.length > 5) {
        console.log(`  ... 还有 ${chapters.length - 5} 个章节 ...`);
      }
    }
    
    console.log('\n5. 测试执行自定义SQL查询...');
    const result = await executeQuery(`
      SELECT COUNT(*) as exam_subjects_count FROM exam_subjects;
      SELECT COUNT(*) as nursing_disciplines_count FROM nursing_disciplines;
      SELECT COUNT(*) as chapters_count FROM chapters;
      SELECT COUNT(*) as knowledge_points_count FROM knowledge_points;
    `);
    
    console.log('数据库统计:');
    if (result && Array.isArray(result)) {
      result.forEach(queryResult => {
        if (queryResult && queryResult.rows && queryResult.rows.length > 0) {
          const row = queryResult.rows[0];
          console.log(`  - ${Object.keys(row)[0]}: ${Object.values(row)[0]}`);
        }
      });
    }
    
    console.log('\n=== 测试完成 ===');
    console.log('MCP Server 连接正常，可以访问数据库');
  } catch (error) {
    console.error('\n=== 测试失败 ===');
    console.error('错误信息:', error);
  }
}

// 执行测试
testMCPConnection(); 