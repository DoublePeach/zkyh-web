/**
 * @description 测试 PostgreSQL MCP Server 连接
 * @author 郝桃桃
 * @date 2024-08-05
 */

import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createSmitheryUrl } from "@smithery/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { DB_CONFIG, MCP_CONFIG } from "../src/lib/config.js";

// PostgreSQL 连接配置
const config = {
  connectionString: DB_CONFIG.PG_CONNECTION_STRING
};

// Smithery API 密钥
const SMITHERY_API_KEY = MCP_CONFIG.SMITHERY_API_KEY;

// MCP Server URL
const MCP_SERVER_URL = MCP_CONFIG.MCP_SERVER_URL;

/**
 * 创建 MCP 客户端
 */
async function createMCPClient() {
  try {
    // 创建 Smithery URL
    const serverUrl = createSmitheryUrl(MCP_SERVER_URL, config, SMITHERY_API_KEY);
    
    // 创建 HTTP 传输层
    const transport = new StreamableHTTPClientTransport(serverUrl);
    
    // 创建 MCP 客户端
    const client = new Client({
      name: "ZKYH Database Client",
      version: "1.0.0"
    });
    
    // 连接到 MCP Server
    await client.connect(transport);
    
    return client;
  } catch (error) {
    console.error("创建 MCP 客户端失败:", error);
    throw error;
  }
}

/**
 * 列出所有可用工具
 */
async function listTools() {
  try {
    const client = await createMCPClient();
    const tools = await client.listTools();
    console.log("可用工具列表:", tools.map(t => t.name).join(", "));
    return tools;
  } catch (error) {
    console.error("获取工具列表失败:", error);
    return [];
  }
}

/**
 * 执行 SQL 查询
 */
async function executeQuery(sql) {
  try {
    const client = await createMCPClient();
    const tools = await client.listTools();
    const queryTool = tools.find(t => t.name === "query");
    
    if (!queryTool) {
      throw new Error("MCP Server 中找不到 'query' 工具");
    }
    
    console.log(`执行查询: ${sql}`);
    const result = await client.invoke(queryTool.name, { sql });
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
    const client = await createMCPClient();
    const tools = await client.listTools();
    const listSchemasTool = tools.find(t => t.name === "list_schemas");
    
    if (!listSchemasTool) {
      throw new Error("MCP Server 中找不到 'list_schemas' 工具");
    }
    
    console.log("获取所有数据库架构...");
    const result = await client.invoke(listSchemasTool.name, {});
    console.log("数据库架构:", result.schemas.join(", "));
    return result.schemas;
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
    const client = await createMCPClient();
    const tools = await client.listTools();
    const listTablesTool = tools.find(t => t.name === "list_tables");
    
    if (!listTablesTool) {
      throw new Error("MCP Server 中找不到 'list_tables' 工具");
    }
    
    console.log(`获取架构 '${schema}' 中的所有表...`);
    const result = await client.invoke(listTablesTool.name, { schema });
    console.log(`架构 '${schema}' 中的表:`, result.tables.join(", "));
    return result.tables;
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
    const client = await createMCPClient();
    const tools = await client.listTools();
    const describeTableTool = tools.find(t => t.name === "describe_table");
    
    if (!describeTableTool) {
      throw new Error("MCP Server 中找不到 'describe_table' 工具");
    }
    
    console.log(`获取表 '${schema}.${tableName}' 的结构...`);
    const result = await client.invoke(describeTableTool.name, { 
      table_name: tableName,
      schema 
    });
    
    console.log(`表 '${schema}.${tableName}' 的列:`, result.columns.map(c => c.name).join(", "));
    return result;
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
      console.log(`- ${subject.id}: ${subject.name} (${subject.description})`);
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
async function fetchChapters(examSubjectId) {
  try {
    const sql = `SELECT id, name, content, exam_subject_id FROM chapters WHERE exam_subject_id = '${examSubjectId}' ORDER BY id`;
    const result = await executeQuery(sql);
    console.log(`获取到 ${result.rows.length} 个章节 (学科ID: ${examSubjectId}):`);
    result.rows.forEach(chapter => {
      console.log(`- ${chapter.id}: ${chapter.name}`);
    });
    return result.rows;
  } catch (error) {
    console.error(`获取章节失败 (学科ID: ${examSubjectId}):`, error);
    return [];
  }
}

/**
 * 主测试函数
 */
async function runTest() {
  console.log("开始测试 PostgreSQL MCP Server 连接...");
  
  try {
    // 测试 1: 列出所有工具
    console.log("\n测试 1: 列出所有工具");
    await listTools();
    
    // 测试 2: 列出所有架构
    console.log("\n测试 2: 列出所有架构");
    const schemas = await listSchemas();
    
    // 测试 3: 列出公共架构中的所有表
    console.log("\n测试 3: 列出公共架构中的所有表");
    const tables = await listTables();
    
    // 测试 4: 描述考试学科表
    if (tables.includes("exam_subjects")) {
      console.log("\n测试 4: 描述考试学科表");
      await describeTable("exam_subjects");
    }
    
    // 测试 5: 获取所有考试学科
    console.log("\n测试 5: 获取所有考试学科");
    const subjects = await fetchExamSubjects();
    
    // 测试 6: 获取第一个学科的章节
    if (subjects.length > 0) {
      console.log("\n测试 6: 获取第一个学科的章节");
      await fetchChapters(subjects[0].id);
    }
    
    console.log("\n所有测试完成");
  } catch (error) {
    console.error("测试失败:", error);
  }
}

// 运行测试
runTest(); 