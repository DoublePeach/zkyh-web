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
  // 环境变量获取（支持多种格式）
  get OPENROUTER_API_KEY(): string {
    return getEnv('OPENROUTER_API_KEY') || 
           getEnv('NEXT_PUBLIC_OPENROUTER_API_KEY') || 
           // 硬编码备用密钥（根据用户提供的密钥）
           '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';
  },
  
  // OpenRouter API 基础 URL
  get OPENROUTER_BASE_URL(): string {
    return getEnv('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1') || 
           getEnv('NEXT_PUBLIC_OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1');
  },
  
  // Deepseek API 密钥（支持多种格式）
  get DEEPSEEK_API_KEY(): string {
    return getEnv('DEEPSEEK_API_KEY') || 
           getEnv('NEXT_PUBLIC_DEEPSEEK_API_KEY') || 
           // 硬编码备用密钥（仅开发环境使用）
           (isDev ? 'sk-ed222c4e2fcc4a64af6b3692e29cf443' : '');
  },
  
  // Deepseek API 基础 URL
  get DEEPSEEK_BASE_URL(): string {
    return getEnv('DEEPSEEK_BASE_URL', 'https://api.deepseek.com') || 
           getEnv('NEXT_PUBLIC_DEEPSEEK_BASE_URL', 'https://api.deepseek.com');
  },
  
  // 默认模型供应商 (deepseek 或 openrouter)
  get DEFAULT_PROVIDER(): string {
    return getEnv('DEFAULT_PROVIDER', 'openrouter') || 
           getEnv('NEXT_PUBLIC_DEFAULT_PROVIDER', 'openrouter');
  },
  
  // 默认模型
  get DEFAULT_MODEL(): string {
    return getEnv('DEFAULT_MODEL', 'anthropic/claude-3.7-sonnet') || 
           getEnv('NEXT_PUBLIC_DEFAULT_MODEL', 'anthropic/claude-3.7-sonnet');
  },
  
  // 调试模式
  get DEBUG(): boolean {
    return getEnv('AI_DEBUG', 'false') === 'true' || 
           getEnv('NEXT_PUBLIC_AI_DEBUG', 'false') === 'true' || 
           isDev;
  },
  
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