



# PostgreSQL MCP Server 综合总结报告

## 基本介绍

PostgreSQL MCP Server 是一个基于 Model Context Protocol (MCP) 的工具，为AI代理提供与PostgreSQL数据库无缝交互的标准化接口。它让AI能够执行SQL查询、列出数据库架构、描述表结构等操作，大大简化了数据库交互过程并提高了数据利用效率。

## 主要功能工具

该服务器提供六个核心工具：

1. **query** - 在PostgreSQL数据库上执行SQL查询
2. **list_schemas** - 列出数据库中的所有架构
3. **list_tables** - 列出特定架构中的所有表（默认为'public'架构）
4. **describe_table** - 获取表的详细信息和结构
5. **get_foreign_keys** - 获取表的外键信息
6. **find_relationships** - 分析并找出表的显式和隐式关系

## 安全与配置

**安全注意事项**：
- 该MCP服务器需要数据库凭证
- 强烈建议本地运行以保护敏感信息

**配置要求**：
- 必需配置`connectionString`：PostgreSQL连接字符串，格式为`postgresql://username:password@host:port/database`

## 技术集成

### API集成
服务器可以通过Smithery API与应用程序集成：

1. **安装SDK**：
   ```bash
   npm install @modelcontextprotocol/sdk @smithery/sdk
   ```

2. **TypeScript集成示例**:
   ```typescript
   import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
   import { createSmitheryUrl } from "@smithery/sdk"
 
   const config = {
     "connectionString": "string"
   }
   const serverUrl = createSmitheryUrl("https://server.smithery.ai/@gldc/mcp-postgres", config, "your-smithery-api-key")
 
   const transport = new StreamableHTTPClientTransport(serverUrl)
 
   import { Client } from "@modelcontextprotocol/sdk/client/index.js"
 
   const client = new Client({
     name: "Test client",
     version: "1.0.0"
   })
   await client.connect(transport)
 
   // 使用服务器工具
   const tools = await client.listTools()
   console.log(`Available tools: ${tools.map(t => t.name).join(", ")}`)
   ```

## 总结

PostgreSQL MCP Server是一个强大的工具，它使AI代理能够轻松地与PostgreSQL数据库进行交互。通过标准化的接口和全面的工具集，它允许复杂的数据库操作，包括查询执行、架构分析和关系探索。对于需要数据库访问功能的AI应用程序，这是一个极具价值的组件，但用户应注意其安全性要求，最好在本地环境中运行以保护数据库凭证。