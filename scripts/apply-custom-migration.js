/**
 * @description 执行自定义SQL迁移脚本
 * @author 郝桃桃
 * @date 2024-09-29
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 获取环境变量
require('dotenv').config();

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'zkyh_db1',
};

// 迁移文件路径
const migrationFile = path.join(__dirname, '../drizzle/migrations/add_nursing_assistant_user_id.sql');

async function applyMigration() {
  const client = new Client(dbConfig);
  
  try {
    console.log('正在连接到数据库...');
    await client.connect();
    
    // 读取迁移SQL文件
    console.log(`读取迁移文件: ${migrationFile}`);
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    // 执行SQL
    console.log('执行SQL迁移...');
    await client.query(sql);
    
    console.log('迁移执行成功!');
  } catch (error) {
    console.error('迁移执行失败:', error);
  } finally {
    await client.end();
  }
}

// 执行迁移
applyMigration(); 