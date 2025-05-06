/**
 * @description PostgreSQL MCP Server 连接服务，基于 Model Context Protocol 规范
 * @author 郝桃桃
 * @date 2024-08-05
 */

import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createSmitheryUrl } from "./smithery-sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { DB_CONFIG, MCP_CONFIG } from '@/lib/config';

// PostgreSQL 连接配置
const config = {
  connectionString: DB_CONFIG.PG_CONNECTION_STRING
};

/**
 * @description 创建 MCP 客户端
 * @returns {Promise<Client>} MCP 客户端
 */
async function createMCPClient(): Promise<Client> {
  try {
    // 创建 Smithery URL
    const serverUrl = createSmitheryUrl(MCP_CONFIG.MCP_SERVER_URL, config, MCP_CONFIG.SMITHERY_API_KEY);
    
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
 * @description 获取 MCP Server 可用工具列表
 * @returns {Promise<string[]>} 工具名称列表
 */
export async function listMCPTools(): Promise<string[]> {
  try {
    const client = await createMCPClient();
    const tools = await client.listTools();
    return tools.map(t => t.name);
  } catch (error) {
    console.error("获取 MCP 工具列表失败:", error);
    return [];
  }
}

/**
 * @description 执行 SQL 查询
 * @param {string} sql - SQL 查询语句
 * @returns {Promise<any>} 查询结果
 */
export async function executeQuery(sql: string): Promise<any> {
  try {
    const client = await createMCPClient();
    
    // 获取工具列表
    const tools = await client.listTools();
    const queryTool = tools.find(t => t.name === "query");
    
    if (!queryTool) {
      throw new Error("MCP Server 中找不到 'query' 工具");
    }
    
    // 执行查询
    const result = await client.invoke(queryTool.name, { sql });
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
    const client = await createMCPClient();
    
    // 获取工具列表
    const tools = await client.listTools();
    const listSchemasTool = tools.find(t => t.name === "list_schemas");
    
    if (!listSchemasTool) {
      throw new Error("MCP Server 中找不到 'list_schemas' 工具");
    }
    
    // 获取所有架构
    const result = await client.invoke(listSchemasTool.name, {});
    return result.schemas || [];
  } catch (error) {
    console.error("列出架构失败", error);
    return [];
  }
}

/**
 * @description 列出指定架构中的所有表
 * @param {string} schema - 架构名称，默认为 'public'
 * @returns {Promise<string[]>} 表名列表
 */
export async function listTables(schema: string = "public"): Promise<string[]> {
  try {
    const client = await createMCPClient();
    
    // 获取工具列表
    const tools = await client.listTools();
    const listTablesTool = tools.find(t => t.name === "list_tables");
    
    if (!listTablesTool) {
      throw new Error("MCP Server 中找不到 'list_tables' 工具");
    }
    
    // 获取所有表
    const result = await client.invoke(listTablesTool.name, { schema });
    return result.tables || [];
  } catch (error) {
    console.error(`列出表失败 (架构: ${schema})`, error);
    return [];
  }
}

/**
 * @description 获取表的详细信息
 * @param {string} tableName - 表名
 * @param {string} schema - 架构名称，默认为 'public'
 * @returns {Promise<any>} 表的详细信息
 */
export async function describeTable(tableName: string, schema: string = "public"): Promise<any> {
  try {
    const client = await createMCPClient();
    
    // 获取工具列表
    const tools = await client.listTools();
    const describeTableTool = tools.find(t => t.name === "describe_table");
    
    if (!describeTableTool) {
      throw new Error("MCP Server 中找不到 'describe_table' 工具");
    }
    
    // 获取表详情
    return await client.invoke(describeTableTool.name, { table_name: tableName, schema });
  } catch (error) {
    console.error(`获取表详情失败 (表: ${tableName}, 架构: ${schema})`, error);
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
    return result.rows || [];
  } catch (error) {
    console.error("获取考试学科失败:", error);
    return [];
  }
}

/**
 * @description 从数据库获取章节列表
 * @param {string} examSubjectId - 考试学科ID
 * @returns {Promise<any[]>} 章节列表
 */
export async function fetchChapters(examSubjectId: string): Promise<any[]> {
  try {
    const sql = `SELECT id, name, content, exam_subject_id FROM chapters WHERE exam_subject_id = '${examSubjectId}' ORDER BY id`;
    const result = await executeQuery(sql);
    return result.rows || [];
  } catch (error) {
    console.error(`获取章节失败 (学科ID: ${examSubjectId}):`, error);
    return [];
  }
} 