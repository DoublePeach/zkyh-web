/**
 * @description 直接数据库连接服务 - 作为MCP备选方案
 * @author 郝桃桃
 * @date 2024-08-24
 */

import { Pool } from 'pg';
import { DB_CONFIG } from './config';

// 创建连接池
const pool = new Pool({
  host: DB_CONFIG.HOST,
  port: DB_CONFIG.PORT,
  user: DB_CONFIG.USER,
  password: DB_CONFIG.PASSWORD,
  database: DB_CONFIG.DATABASE,
  ssl: false, // 根据需要设置SSL
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000, // 连接空闲超时
  connectionTimeoutMillis: 5000, // 连接超时
});

// 初始化检查连接
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

/**
 * @description 执行SQL查询
 * @param {string} sql - SQL查询语句
 * @param {any[]} params - 查询参数
 * @returns {Promise<any>} 查询结果
 */
export async function executeQuery(sql: string, params: any[] = []): Promise<any> {
  // 检查是否是多个查询
  if (sql.includes(';') && sql.trim().split(';').filter(q => q.trim()).length > 1) {
    return executeMultipleQueries(sql);
  }
  
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(sql, params);
      return result;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('直接数据库查询失败:', error);
    throw error;
  }
}

/**
 * @description 执行多个SQL查询
 * @param {string} sql - 包含多个查询的SQL语句
 * @returns {Promise<any[]>} 查询结果数组
 */
async function executeMultipleQueries(sql: string): Promise<any[]> {
  const queries = sql.trim().split(';').filter(q => q.trim());
  const results = [];
  
  try {
    const client = await pool.connect();
    try {
      for (const query of queries) {
        if (query.trim()) {
          const result = await client.query(query);
          results.push(result);
        }
      }
      return results;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('执行多个查询失败:', error);
    throw error;
  }
}

/**
 * @description 获取数据库表列表
 * @returns {Promise<string[]>} 表名列表
 */
export async function listTables(): Promise<string[]> {
  try {
    const result = await executeQuery(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    return result.rows.map((row: any) => row.table_name);
  } catch (error) {
    console.error('获取表列表失败:', error);
    return [];
  }
}

/**
 * @description 获取考试学科列表
 * @returns {Promise<any[]>} 考试学科列表
 */
export async function fetchExamSubjects(): Promise<any[]> {
  try {
    const result = await executeQuery(
      "SELECT id, name, description FROM exam_subjects ORDER BY id"
    );
    return result.rows;
  } catch (error) {
    console.error('获取考试学科列表失败:', error);
    return [];
  }
}

/**
 * @description 获取章节列表
 * @param {string|number} examSubjectId - 考试学科ID
 * @returns {Promise<any[]>} 章节列表
 */
export async function fetchChapters(examSubjectId: string | number): Promise<any[]> {
  try {
    const result = await executeQuery(
      "SELECT id, name, content, exam_subject_id FROM chapters WHERE exam_subject_id = $1 ORDER BY id",
      [examSubjectId]
    );
    return result.rows;
  } catch (error) {
    console.error(`获取章节列表失败 (学科ID: ${examSubjectId}):`, error);
    return [];
  }
}

/**
 * @description 获取护理学科列表
 * @returns {Promise<any[]>} 护理学科列表 
 */
export async function fetchNursingDisciplines(): Promise<any[]> {
  try {
    const result = await executeQuery(
      "SELECT id, name, description FROM nursing_disciplines ORDER BY id"
    );
    return result.rows;
  } catch (error) {
    console.error('获取护理学科列表失败:', error);
    return [];
  }
}

/**
 * @description 获取知识点列表
 * @param {string|number} chapterId - 章节ID
 * @returns {Promise<any[]>} 知识点列表
 */
export async function fetchKnowledgePoints(chapterId: string | number): Promise<any[]> {
  try {
    const result = await executeQuery(
      "SELECT id, chapter_id, content, importance FROM knowledge_points WHERE chapter_id = $1 ORDER BY id",
      [chapterId]
    );
    return result.rows;
  } catch (error) {
    console.error(`获取知识点列表失败 (章节ID: ${chapterId}):`, error);
    return [];
  }
}

/**
 * @description 获取各个表的记录数量统计
 * @returns {Promise<Record<string, number>>} 表记录数量统计
 */
export async function getTableStats(): Promise<Record<string, number>> {
  try {
    const stats: Record<string, number> = {};
    
    // 获取考试学科数量
    const examSubjectsResult = await executeQuery("SELECT COUNT(*) as count FROM exam_subjects");
    stats.exam_subjects_count = parseInt(examSubjectsResult.rows[0].count);
    
    // 获取护理学科数量
    const nursingDisciplinesResult = await executeQuery("SELECT COUNT(*) as count FROM nursing_disciplines");
    stats.nursing_disciplines_count = parseInt(nursingDisciplinesResult.rows[0].count);
    
    // 获取章节数量
    const chaptersResult = await executeQuery("SELECT COUNT(*) as count FROM chapters");
    stats.chapters_count = parseInt(chaptersResult.rows[0].count);
    
    // 获取知识点数量
    const knowledgePointsResult = await executeQuery("SELECT COUNT(*) as count FROM knowledge_points");
    stats.knowledge_points_count = parseInt(knowledgePointsResult.rows[0].count);
    
    return stats;
  } catch (error) {
    console.error('获取表统计信息失败:', error);
    return {};
  }
} 