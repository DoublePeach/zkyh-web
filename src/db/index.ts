import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * @description 数据库连接配置
 * @author 郝桃桃
 * @date 2023-10-01
 */

// 确保数据库URL存在
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/zkyh_db';

// PostgreSQL连接选项
const connectionOptions = {
  max: 10, // 最大连接数
  idle_timeout: 30, // 空闲连接超时（秒）
  connect_timeout: 10, // 连接超时（秒）
  // 确保使用UTF-8字符集
  options: `-c client_encoding=UTF8`
};

// 创建PostgreSQL客户端
const client = postgres(DATABASE_URL, connectionOptions);

// 创建Drizzle ORM实例
export const db = drizzle(client, { schema });

// 导出数据模型以便在其他地方使用
export * from './schema'; 