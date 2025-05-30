/**
 * @description 全局配置文件，集中管理配置信息
 * @author 郝桃桃
 * @date 2024-08-05 (更新于2024-09-xx)
 */

// 获取环境变量，带默认值
const getEnv = (key: string, defaultValue: string = ''): string => 
  typeof process !== 'undefined' && process.env && process.env[key] 
    ? process.env[key] as string 
    : defaultValue;

// 当前环境
const NODE_ENV = getEnv('NODE_ENV', 'development');
const isDev = NODE_ENV === 'development';
const isProd = NODE_ENV === 'production';

// 数据库配置 - 使用环境变量，避免硬编码敏感信息
export const DB_CONFIG = {
  // 环境标志
  isDev,
  isProd,
  
  // 从环境变量获取数据库配置
  HOST: getEnv('DB_HOST', 'localhost'),
  PORT: parseInt(getEnv('DB_PORT', '5432')),
  USER: getEnv('DB_USER', 'postgres'),
  PASSWORD: getEnv('DB_PASSWORD', ''),
  DATABASE: getEnv('DB_NAME', isDev ? 'zkyh_db1' : 'zkyh_db'),
  
  // 连接字符串 (优先从DATABASE_URL读取，否则构建)
  get PG_CONNECTION_STRING(): string {
    // 优先使用完整的连接字符串环境变量
    const configuredUrl = getEnv('DATABASE_URL');
    if (configuredUrl) return configuredUrl;
    
    // 构建连接字符串
    const passwordPart = this.PASSWORD ? `:${this.PASSWORD}` : '';
    return `postgresql://${this.USER}${passwordPart}@${this.HOST}:${this.PORT}/${this.DATABASE}`;
  }
};

// AI 模型配置
export const AI_CONFIG = {
  // OpenRouter API 密钥 (使用环境变量，此处不再提供默认值)
  OPENROUTER_API_KEY: getEnv('OPENROUTER_API_KEY'),
  // OpenRouter API 基础 URL
  OPENROUTER_BASE_URL: getEnv('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
  // Deepseek API 密钥
  DEEPSEEK_API_KEY: getEnv('DEEPSEEK_API_KEY'),
  // Deepseek API 基础 URL
  DEEPSEEK_BASE_URL: getEnv('DEEPSEEK_BASE_URL', 'https://api.deepseek.com/v1'),
  // 默认模型供应商 (deepseek 或 openrouter)
  DEFAULT_PROVIDER: getEnv('DEFAULT_PROVIDER', 'deepseek'),
  // 默认模型
  DEFAULT_MODEL: getEnv('DEFAULT_MODEL', 'deepseek-chat'),
  // 获取当前API密钥
  get CURRENT_API_KEY(): string {
    return this.DEFAULT_PROVIDER === 'deepseek' ? this.DEEPSEEK_API_KEY : this.OPENROUTER_API_KEY;
  },
  // 获取当前API基础URL
  get CURRENT_BASE_URL(): string {
    return this.DEFAULT_PROVIDER === 'deepseek' ? this.DEEPSEEK_BASE_URL : this.OPENROUTER_BASE_URL;
  }
};

// MCP 配置
export const MCP_CONFIG = {
  // Smithery API 密钥
  SMITHERY_API_KEY: getEnv('SMITHERY_API_KEY'),
  // MCP Server URL
  MCP_SERVER_URL: getEnv('MCP_SERVER_URL', 'https://server.smithery.ai/@gldc/mcp-postgres'),
}; 