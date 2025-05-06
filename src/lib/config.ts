/**
 * @description 全局配置文件，集中管理敏感配置信息
 * @author 郝桃桃
 * @date 2024-08-05
 */

// 获取环境变量，带默认值
const getEnv = (key: string, defaultValue: string): string => 
  typeof process !== 'undefined' && process.env && process.env[key] 
    ? process.env[key] as string 
    : defaultValue;

// 当前环境
const NODE_ENV = getEnv('NODE_ENV', 'development');
const isDev = NODE_ENV === 'development';

// 数据库配置
export const DB_CONFIG = {
  // 环境标志
  isDev,
  isProd: !isDev,
  
  // 生产环境数据库参数
  PROD_HOST: getEnv('PG_HOST', '124.220.178.188'),
  PROD_PORT: parseInt(getEnv('PG_PORT', '5432')),
  PROD_USER: getEnv('PG_USER', 'postgres'),
  PROD_PASSWORD: getEnv('PG_PASSWORD', '3333'),
  PROD_DATABASE: getEnv('PG_DATABASE', 'zkyh_db'),
  
  // 开发环境数据库参数
  DEV_HOST: getEnv('PG_DEV_HOST', 'localhost'),
  DEV_PORT: parseInt(getEnv('PG_DEV_PORT', '5432')),
  DEV_USER: getEnv('PG_DEV_USER', 'postgres'),
  DEV_PASSWORD: getEnv('PG_DEV_PASSWORD', ''),
  DEV_DATABASE: getEnv('PG_DEV_DATABASE', 'zkyh_db1'),
  
  // 活动数据库参数 (基于当前环境自动选择)
  get HOST(): string {
    return isDev ? this.DEV_HOST : this.PROD_HOST;
  },
  get PORT(): number {
    return isDev ? this.DEV_PORT : this.PROD_PORT;
  },
  get USER(): string {
    return isDev ? this.DEV_USER : this.PROD_USER;
  },
  get PASSWORD(): string {
    return isDev ? this.DEV_PASSWORD : this.PROD_PASSWORD;
  },
  get DATABASE(): string {
    return isDev ? this.DEV_DATABASE : this.PROD_DATABASE;
  },
  
  // 生产环境连接字符串
  get PROD_CONNECTION_STRING(): string {
    return getEnv('DATABASE_URL', 
      `postgresql://${this.PROD_USER}:${this.PROD_PASSWORD}@${this.PROD_HOST}:${this.PROD_PORT}/${this.PROD_DATABASE}`
    );
  },
  
  // 开发环境连接字符串
  get DEV_CONNECTION_STRING(): string {
    const passwordPart = this.DEV_PASSWORD ? `:${this.DEV_PASSWORD}` : '';
    return getEnv('DEV_DATABASE_URL', 
      `postgresql://${this.DEV_USER}${passwordPart}@${this.DEV_HOST}:${this.DEV_PORT}/${this.DEV_DATABASE}`
    );
  },
  
  // 活动连接字符串 (基于当前环境自动选择)
  get PG_CONNECTION_STRING(): string {
    return isDev ? this.DEV_CONNECTION_STRING : this.PROD_CONNECTION_STRING;
  },
  
  // 数据库名称 (兼容旧代码)
  get PG_DATABASE_NAME(): string {
    return this.DATABASE;
  }
};

// AI 模型配置
export const AI_CONFIG = {
  // OpenRouter API 密钥 (已不可用)
  OPENROUTER_API_KEY: getEnv('OPENROUTER_API_KEY', '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'),
  // OpenRouter API 基础 URL
  OPENROUTER_BASE_URL: getEnv('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
  // Deepseek API 密钥
  DEEPSEEK_API_KEY: getEnv('DEEPSEEK_API_KEY', 'sk-ed222c4e2fcc4a64af6b3692e29cf443'),
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
  SMITHERY_API_KEY: getEnv('SMITHERY_API_KEY', '905a415a-4a92-4589-a5cd-640ad2ce3020'),
  // MCP Server URL
  MCP_SERVER_URL: getEnv('MCP_SERVER_URL', 'https://server.smithery.ai/@gldc/mcp-postgres'),
}; 