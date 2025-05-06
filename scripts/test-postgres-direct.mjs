/**
 * @description 测试直接 PostgreSQL 连接
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
 * 列出所有数据库架构
 */
async function listSchemas() {
  try {
    const sql = `
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT LIKE 'pg_%' 
        AND schema_name != 'information_schema'
      ORDER BY schema_name
    `;
    
    const result = await executeQuery(sql);
    const schemas = result.rows.map(row => row.schema_name);
    console.log("数据库架构:", schemas.join(", "));
    return schemas;
  } catch (error) {
    console.error("获取架构列表失败:", error);
    return [];
  }
}

/**
 * 列出指定架构中的所有表
 */
async function listTables(schema = "public") {
  try {
    const sql = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    const result = await executeQuery(sql, [schema]);
    const tables = result.rows.map(row => row.table_name);
    console.log(`架构 '${schema}' 中的表:`, tables.join(", "));
    return tables;
  } catch (error) {
    console.error(`获取表列表失败 (架构: ${schema}):`, error);
    return [];
  }
}

/**
 * 描述表结构
 */
async function describeTable(tableName, schema = "public") {
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
    const primaryKeys = primaryKeyResult.rows.map(row => row.attname);
    
    console.log(`表 '${schema}.${tableName}' 的列:`, columnsResult.rows.map(c => c.name).join(", "));
    console.log(`表 '${schema}.${tableName}' 的主键:`, primaryKeys.join(", "));
    
    return {
      table: tableName,
      schema,
      columns: columnsResult.rows,
      primary_keys: primaryKeys
    };
  } catch (error) {
    console.error(`获取表结构失败 (表: ${tableName}, 架构: ${schema}):`, error);
    return null;
  }
}

/**
 * 获取考试学科列表
 */
async function fetchExamSubjects() {
  try {
    const sql = "SELECT id, name, description FROM exam_subjects ORDER BY id";
    const result = await executeQuery(sql);
    console.log(`获取到 ${result.rows.length} 个考试学科:`);
    result.rows.forEach(subject => {
      console.log(`- ${subject.id}: ${subject.name} (${subject.description || 'No description'})`);
    });
    return result.rows;
  } catch (error) {
    console.error("获取考试学科失败:", error);
    return [];
  }
}

/**
 * 获取章节列表
 */
async function fetchChapters(disciplineId) {
  try {
    const sql = 'SELECT id, name, description, discipline_id FROM chapters WHERE discipline_id = $1 ORDER BY order_index';
    const result = await executeQuery(sql, [disciplineId]);
    console.log(`获取到 ${result.rows.length} 个章节 (学科ID: ${disciplineId}):`);
    result.rows.forEach(chapter => {
      console.log(`- ${chapter.id}: ${chapter.name}`);
    });
    return result.rows;
  } catch (error) {
    console.error(`获取章节失败 (学科ID: ${disciplineId}):`, error);
    return [];
  }
}

/**
 * 获取学科对应的章节
 */
async function getChaptersBySubject(subjectId) {
  try {
    // 先获取与学科相关的护理学科
    const sql = 'SELECT id, name FROM nursing_disciplines WHERE exam_subject_id = $1 ORDER BY id';
    const disciplinesResult = await executeQuery(sql, [subjectId]);
    
    console.log(`获取到 ${disciplinesResult.rows.length} 个护理学科 (考试学科ID: ${subjectId}):`);
    disciplinesResult.rows.forEach(discipline => {
      console.log(`- ${discipline.id}: ${discipline.name}`);
    });
    
    // 获取第一个护理学科的章节
    if (disciplinesResult.rows.length > 0) {
      const firstDiscipline = disciplinesResult.rows[0];
      console.log(`\n获取护理学科 "${firstDiscipline.name}" 的章节:`);
      return await fetchChapters(firstDiscipline.id);
    } else {
      console.log(`没有找到考试学科 ${subjectId} 相关的护理学科`);
      return [];
    }
  } catch (error) {
    console.error(`获取学科章节失败 (学科ID: ${subjectId}):`, error);
    return [];
  }
}

/**
 * 主测试函数
 */
async function runTest() {
  console.log("开始测试直接 PostgreSQL 连接...");
  
  try {
    // 测试连接
    console.log("\n测试连接到 PostgreSQL 数据库...");
    const client = await pool.connect();
    console.log('成功连接到 PostgreSQL 数据库');
    client.release();
    
    // 测试 1: 列出所有架构
    console.log("\n测试 1: 列出所有架构");
    const schemas = await listSchemas();
    
    // 测试 2: 列出公共架构中的所有表
    console.log("\n测试 2: 列出公共架构中的所有表");
    const tables = await listTables();
    
    // 测试 3: 描述考试学科表
    if (tables.includes("exam_subjects")) {
      console.log("\n测试 3: 描述考试学科表");
      await describeTable("exam_subjects");
    }
    
    // 测试 4: 获取所有考试学科
    console.log("\n测试 4: 获取所有考试学科");
    const subjects = await fetchExamSubjects();
    
    // 测试 5: 获取第一个学科的章节
    if (subjects.length > 0) {
      console.log("\n测试 5: 获取第一个学科对应的章节");
      await getChaptersBySubject(subjects[0].id);
    }
    
    console.log("\n所有测试完成");
  } catch (error) {
    console.error("测试失败:", error);
  } finally {
    // 关闭连接池
    await pool.end();
    console.log('已关闭数据库连接池');
  }
}

// 运行测试
runTest(); 