#!/usr/bin/env node
/**
 * @description 数据库连接检查脚本
 * @author 郝桃桃
 * @date 2024-09-01
 */
// 直接导入DB_CONFIG会失败，因为Node不能直接导入TypeScript文件
// 使用环境变量的方式重新构建DB_CONFIG
require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
});

const { Client } = require('pg');

// 重新构建DB_CONFIG，与src/lib/config.ts保持一致
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDev = NODE_ENV === 'development';
const isProd = NODE_ENV === 'production';

function getEnv(key, defaultValue = '') {
  return process.env[key] || defaultValue;
}

const DB_CONFIG = {
  isDev,
  isProd,
  HOST: getEnv('DB_HOST', 'localhost'),
  PORT: parseInt(getEnv('DB_PORT', '5432')),
  USER: getEnv('DB_USER', 'postgres'),
  PASSWORD: getEnv('DB_PASSWORD', ''),
  DATABASE: getEnv('DB_NAME', isDev ? 'zkyh_db1' : 'zkyh_db'),
  
  get PG_CONNECTION_STRING() {
    // 优先使用完整的连接字符串环境变量
    const configuredUrl = getEnv('DATABASE_URL');
    if (configuredUrl) return configuredUrl;
    
    // 构建连接字符串
    const passwordPart = this.PASSWORD ? `:${this.PASSWORD}` : '';
    return `postgresql://${this.USER}${passwordPart}@${this.HOST}:${this.PORT}/${this.DATABASE}`;
  }
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 显示数据库连接信息（隐藏密码）
function displayConnectionInfo() {
  console.log(`${colors.bright}${colors.cyan}数据库连接信息${colors.reset}\n`);
  
  console.log(`${colors.bright}当前环境:${colors.reset} ${DB_CONFIG.isDev ? colors.green + '开发环境' : colors.yellow + '生产环境'}${colors.reset}`);
  
  console.log(`\n${colors.bright}数据库参数:${colors.reset}`);
  console.log(`- ${colors.bright}主机:${colors.reset} ${DB_CONFIG.HOST}`);
  console.log(`- ${colors.bright}端口:${colors.reset} ${DB_CONFIG.PORT}`);
  console.log(`- ${colors.bright}用户:${colors.reset} ${DB_CONFIG.USER}`);
  console.log(`- ${colors.bright}数据库:${colors.reset} ${DB_CONFIG.DATABASE}`);
  
  // 隐藏完整的连接字符串中的密码
  const connectionStr = DB_CONFIG.PG_CONNECTION_STRING;
  const maskedConnectionStr = connectionStr.replace(
    /(postgresql:\/\/[^:]+:)([^@]+)(@.+)/,
    (match, p1, p2, p3) => p2 ? `${p1}******${p3}` : match
  );
  
  console.log(`\n${colors.bright}连接字符串:${colors.reset} ${maskedConnectionStr}`);
}

// 测试数据库连接
async function testConnection() {
  console.log(`\n${colors.bright}正在测试数据库连接...${colors.reset}`);
  
  const client = new Client({
    connectionString: DB_CONFIG.PG_CONNECTION_STRING
  });
  
  try {
    await client.connect();
    console.log(`${colors.green}数据库连接成功!${colors.reset}`);
    
    // 获取数据库版本
    const result = await client.query('SELECT version()');
    console.log(`\n${colors.bright}数据库版本:${colors.reset} ${result.rows[0].version}`);
    
    // 获取一些基本信息
    const tablesResult = await client.query(`
      SELECT count(*) AS table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`${colors.bright}数据库表数量:${colors.reset} ${tablesResult.rows[0].table_count}`);
    
  } catch (error) {
    console.error(`${colors.red}数据库连接失败: ${error.message}${colors.reset}`);
    console.log(`\n${colors.yellow}可能的解决方案:${colors.reset}`);
    console.log('1. 确认数据库服务器正在运行');
    console.log('2. 检查连接参数是否正确');
    console.log('3. 确认网络连接正常，可以访问数据库服务器');
    console.log('4. 确认提供的用户名密码正确');
    console.log('5. 运行 `npm run setup-env` 重新配置数据库连接');
  } finally {
    await client.end();
  }
}

// 主函数
async function main() {
  displayConnectionInfo();
  await testConnection();
}

// 执行
main().catch(err => {
  console.error(`${colors.red}脚本执行错误: ${err.message}${colors.reset}`);
  process.exit(1);
}); 