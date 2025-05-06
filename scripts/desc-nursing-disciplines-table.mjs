/**
 * @description 查询nursing_disciplines表的实际结构
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
 * 描述nursing_disciplines表结构
 */
async function describeNursingDisciplinesTable() {
  try {
    // 获取列信息
    const columnsSQL = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'nursing_disciplines'
      ORDER BY ordinal_position
    `;
    
    const result = await executeQuery(columnsSQL);
    
    console.log('nursing_disciplines表结构:');
    console.table(result.rows);
    
    return result.rows;
  } catch (error) {
    console.error('获取nursing_disciplines表结构失败:', error);
    return null;
  }
}

/**
 * 查询nursing_disciplines表中的样本数据
 */
async function getSampleNursingDisciplinesData() {
  try {
    const sql = 'SELECT * FROM nursing_disciplines LIMIT 3';
    const result = await executeQuery(sql);
    
    console.log('\nnursing_disciplines表样本数据:');
    console.table(result.rows);
    
    return result.rows;
  } catch (error) {
    console.error('获取nursing_disciplines表样本数据失败:', error);
    return null;
  }
}

/**
 * 主测试函数
 */
async function runTest() {
  console.log("查询nursing_disciplines表结构...");
  
  try {
    await describeNursingDisciplinesTable();
    await getSampleNursingDisciplinesData();
    
    console.log("\n查询完成");
  } catch (error) {
    console.error("查询失败:", error);
  } finally {
    // 关闭连接池
    await pool.end();
    console.log('已关闭数据库连接池');
  }
}

// 运行测试
runTest(); 