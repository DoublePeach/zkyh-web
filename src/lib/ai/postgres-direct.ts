/**
 * @description PostgreSQL 直接连接服务，用于代替 MCP Server
 * @author 郝桃桃
 * @date 2024-08-05
 */

import { Pool } from 'pg';
import { DB_CONFIG } from '@/lib/config';

// 创建连接池
const pool = new Pool({ connectionString: DB_CONFIG.PG_CONNECTION_STRING });

/**
 * @description 连接到数据库并执行初始化操作
 * @returns {Promise<void>}
 */
export async function initDatabase(): Promise<void> {
  try {
    // 测试连接
    const client = await pool.connect();
    console.log('成功连接到 PostgreSQL 数据库');
    client.release();
  } catch (error) {
    console.error('连接到 PostgreSQL 数据库失败:', error);
    throw error;
  }
}

/**
 * @description 执行 SQL 查询
 * @param {string} sql - SQL 查询语句
 * @param {any[]} params - 查询参数
 * @returns {Promise<any>} 查询结果
 */
export async function executeQuery(sql: string, params: any[] = []): Promise<any> {
  try {
    const result = await pool.query(sql, params);
    return result;
  } catch (error) {
    console.error(`执行查询失败: ${sql}`, error);
    throw error;
  }
}

/**
 * @description 列出数据库中的所有架构
 * @returns {Promise<string[]>} 架构列表
 */
export async function listSchemas(): Promise<string[]> {
  try {
    const sql = `
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT LIKE 'pg_%' 
        AND schema_name != 'information_schema'
      ORDER BY schema_name
    `;
    
    const result = await executeQuery(sql);
    return result.rows.map((row: any) => row.schema_name);
  } catch (error) {
    console.error('获取架构列表失败:', error);
    throw error;
  }
}

/**
 * @description 列出指定架构中的所有表
 * @param {string} schema - 架构名称，默认为 'public'
 * @returns {Promise<string[]>} 表名列表
 */
export async function listTables(schema: string = 'public'): Promise<string[]> {
  try {
    const sql = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    const result = await executeQuery(sql, [schema]);
    return result.rows.map((row: any) => row.table_name);
  } catch (error) {
    console.error(`获取表列表失败 (架构: ${schema}):`, error);
    throw error;
  }
}

/**
 * @description 获取表的详细信息
 * @param {string} tableName - 表名
 * @param {string} schema - 架构名称，默认为 'public'
 * @returns {Promise<any>} 表的详细信息
 */
export async function describeTable(tableName: string, schema: string = 'public'): Promise<any> {
  try {
    // 获取列信息
    const columnsSQL = `
      SELECT 
        column_name as name,
        data_type as type,
        is_nullable,
        column_default as default_value
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `;
    
    const columnsResult = await executeQuery(columnsSQL, [schema, tableName]);
    
    // 获取主键信息
    const primaryKeySQL = `
      SELECT a.attname
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = ($1 || '.' || $2)::regclass
        AND i.indisprimary
    `;
    
    const primaryKeyResult = await executeQuery(primaryKeySQL, [schema, tableName]);
    const primaryKeys = primaryKeyResult.rows.map((row: any) => row.attname);
    
    // 获取外键信息
    const foreignKeysSQL = `
      SELECT
        kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = $1
        AND tc.table_name = $2
    `;
    
    const foreignKeysResult = await executeQuery(foreignKeysSQL, [schema, tableName]);
    
    return {
      table: tableName,
      schema,
      columns: columnsResult.rows,
      primary_keys: primaryKeys,
      foreign_keys: foreignKeysResult.rows
    };
  } catch (error) {
    console.error(`获取表详情失败 (表: ${tableName}, 架构: ${schema}):`, error);
    throw error;
  }
}

/**
 * @description 从数据库获取考试学科列表
 * @returns {Promise<any[]>} 考试学科列表
 */
export async function fetchExamSubjects(): Promise<any[]> {
  try {
    const sql = "SELECT id, name, description FROM exam_subjects ORDER BY id";
    const result = await executeQuery(sql);
    return result.rows;
  } catch (error) {
    console.error('获取考试学科失败:', error);
    throw error;
  }
}

/**
 * @description 从数据库获取章节列表
 * @param {string} examSubjectId - 考试学科ID
 * @returns {Promise<any[]>} 章节列表
 */
export async function fetchChapters(examSubjectId: string): Promise<any[]> {
  try {
    const sql = 'SELECT id, name, content, exam_subject_id FROM chapters WHERE exam_subject_id = $1 ORDER BY id';
    const result = await executeQuery(sql, [examSubjectId]);
    return result.rows;
  } catch (error) {
    console.error(`获取章节失败 (学科ID: ${examSubjectId}):`, error);
    throw error;
  }
}

/**
 * @description 清理连接池
 * @returns {Promise<void>}
 */
export async function closeConnections(): Promise<void> {
  try {
    await pool.end();
    console.log('已关闭数据库连接池');
  } catch (error) {
    console.error('关闭数据库连接池失败:', error);
    throw error;
  }
} 