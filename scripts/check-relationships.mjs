/**
 * @description 检查nursing_disciplines与exam_subjects的关系
 * @author 郝桃桃
 * @date 2024-08-05
 */

import pg from 'pg';
import { DB_CONFIG } from '../src/lib/config.js';
const { Pool } = pg;

// 创建连接池
const pool = new Pool({ connectionString: DB_CONFIG.PG_CONNECTION_STRING });

/**
 * 执行 SQL 查询
 */
async function executeQuery(sql, params = []) {
  try {
    console.log(`执行查询: ${sql}`, params.length > 0 ? `参数: ${params.join(', ')}` : '');
    const result = await pool.query(sql, params);
    return result;
  } catch (error) {
    console.error(`执行查询失败: ${sql}`, error);
    throw error;
  }
}

/**
 * 检查外键关系
 */
async function checkForeignKeys() {
  try {
    const sql = `
      SELECT
        tc.table_name AS source_table,
        kcu.column_name AS source_column,
        ccu.table_name AS target_table,
        ccu.column_name AS target_column
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (tc.table_name = 'nursing_disciplines' OR ccu.table_name = 'nursing_disciplines'
            OR tc.table_name = 'exam_subjects' OR ccu.table_name = 'exam_subjects')
        AND tc.table_schema = 'public'
    `;
    
    const result = await executeQuery(sql);
    
    console.log('外键关系:');
    console.table(result.rows);
    
    return result.rows;
  } catch (error) {
    console.error('检查外键关系失败:', error);
    return null;
  }
}

/**
 * 检查nursing_disciplines与其他表的可能关系
 */
async function findRelationships() {
  try {
    // 查看test_banks表与nursing_disciplines的关系
    const sql = `
      SELECT 
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'test_banks' 
        AND column_name LIKE '%discipline%'
    `;
    
    const result = await executeQuery(sql);
    
    console.log('test_banks表与nursing_disciplines的可能关系:');
    console.table(result.rows);
    
    return result.rows;
  } catch (error) {
    console.error('查找关系失败:', error);
    return null;
  }
}

/**
 * 检查test_banks表结构
 */
async function checkTestBanksStructure() {
  try {
    const sql = `
      SELECT 
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'test_banks'
      ORDER BY ordinal_position
    `;
    
    const result = await executeQuery(sql);
    
    console.log('test_banks表结构:');
    console.table(result.rows);
    
    return result.rows;
  } catch (error) {
    console.error('获取test_banks表结构失败:', error);
    return null;
  }
}

/**
 * 获取测试题库示例数据
 */
async function getSampleTestBanks() {
  try {
    const sql = 'SELECT * FROM test_banks LIMIT 3';
    const result = await executeQuery(sql);
    
    console.log('\ntest_banks表样本数据:');
    console.table(result.rows);
    
    return result.rows;
  } catch (error) {
    console.error('获取test_banks样本数据失败:', error);
    return null;
  }
}

/**
 * 主测试函数
 */
async function runTest() {
  console.log("开始检查nursing_disciplines与exam_subjects的关系...");
  
  try {
    // 检查外键关系
    await checkForeignKeys();
    
    // 查找可能的关系
    await findRelationships();
    
    // 检查test_banks表结构
    await checkTestBanksStructure();
    
    // 获取样本数据
    await getSampleTestBanks();
    
    console.log("\n检查完成");
  } catch (error) {
    console.error("检查失败:", error);
  } finally {
    // 关闭连接池
    await pool.end();
    console.log('已关闭数据库连接池');
  }
}

// 运行测试
runTest(); 