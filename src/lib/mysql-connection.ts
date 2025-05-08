/**
 * @description MySQL数据库连接配置 - 用于护理助手APP集成
 * @author 郝桃桃
 * @date 2024-09-28
 */
import mysql from 'mysql2/promise';

// 获取环境变量，带默认值
const getEnv = (key: string, defaultValue: string = ''): string => 
  typeof process !== 'undefined' && process.env && process.env[key] 
    ? process.env[key] as string 
    : defaultValue;

// MySQL配置
export const MYSQL_CONFIG = {
  HOST: getEnv('MYSQL_HOST', 'localhost'),
  PORT: parseInt(getEnv('MYSQL_PORT', '3306')),
  USER: getEnv('MYSQL_USER', 'root'),
  PASSWORD: getEnv('MYSQL_PASSWORD', ''),
  DATABASE: getEnv('MYSQL_DATABASE', 'nursing_assistant'),
};

// 创建MySQL连接池
let mysqlPool: mysql.Pool | null = null;

/**
 * @description 获取MySQL连接池
 * @returns MySQL连接池
 */
export const getMySqlPool = (): mysql.Pool => {
  if (!mysqlPool) {
    mysqlPool = mysql.createPool({
      host: MYSQL_CONFIG.HOST,
      port: MYSQL_CONFIG.PORT,
      user: MYSQL_CONFIG.USER,
      password: MYSQL_CONFIG.PASSWORD, 
      database: MYSQL_CONFIG.DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return mysqlPool;
};

/**
 * @description 关闭MySQL连接池
 */
export const closeMySqlPool = async (): Promise<void> => {
  if (mysqlPool) {
    await mysqlPool.end();
    mysqlPool = null;
  }
};

/**
 * @description 根据用户ID从护理助手数据库获取用户信息
 * @param userId 护理助手用户ID
 * @returns 用户信息
 */
export const getNursingAssistantUser = async (userId: string) => {
  const pool = getMySqlPool();
  try {
    // 查询用户信息，根据具体护理助手的数据表结构调整
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    // 返回查询结果
    return (rows as any[])[0] || null;
  } catch (error) {
    console.error('获取护理助手用户信息失败:', error);
    throw error;
  }
};

/**
 * @description 验证护理助手的有效用户
 * @param userId 用户ID
 * @returns 是否有效用户
 */
export const validateNursingAssistantUser = async (userId: string): Promise<boolean> => {
  try {
    const user = await getNursingAssistantUser(userId);
    return !!user;
  } catch (error) {
    console.error('验证护理助手用户失败:', error);
    return false;
  }
}; 