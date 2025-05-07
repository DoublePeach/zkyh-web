/**
 * @description 重置数据库序列生成器脚本 - 解决ID冲突问题
 * @author 郝桃桃
 * @date 2024-08-25
 */

import { db } from './index';
import { sql } from 'drizzle-orm';
import { config } from 'dotenv';

// 加载环境变量
config();

/**
 * 重置指定表的序列生成器
 * @param tableName 表名
 * @param idColumn ID列名，默认为'id'
 */
async function resetSequence(tableName: string, idColumn: string = 'id'): Promise<void> {
  try {
    console.log(`开始重置 ${tableName} 表的序列生成器...`);
    
    // 序列名通常是 表名_列名_seq
    const sequenceName = `${tableName}_${idColumn}_seq`;
    
    // 查询表中最大ID - 使用模板字符串直接构建SQL
    const maxIdQuery = `SELECT MAX(${idColumn}) as max_id FROM ${tableName}`;
    const result = await db.execute(sql.raw(maxIdQuery));
    
    const maxId = Number(result[0]?.max_id || 0);
    console.log(`${tableName} 表中最大ID为: ${maxId}`);
    
    // 重置序列到最大ID+1 - 使用模板字符串直接构建SQL
    const resetQuery = `ALTER SEQUENCE ${sequenceName} RESTART WITH ${maxId + 1}`;
    await db.execute(sql.raw(resetQuery));
    
    console.log(`已成功重置 ${tableName} 表的序列生成器到 ${maxId + 1}`);
  } catch (error) {
    console.error(`重置 ${tableName} 表序列生成器时出错:`, error);
    throw error;
  }
}

/**
 * 主函数 - 重置所有需要的序列
 */
async function main(): Promise<void> {
  try {
    // 重置knowledge_points表序列
    await resetSequence('knowledge_points');
    
    // 重置chapters表序列
    await resetSequence('chapters');
    
    // 可以添加其他需要重置的表
    // await resetSequence('exam_subjects');
    // await resetSequence('quiz_questions');
    
    console.log('所有序列重置完成！');
  } catch (error) {
    console.error('重置序列时出错:', error);
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main()
    .then(() => {
      console.log('序列重置脚本执行成功');
      process.exit(0);
    })
    .catch((error) => {
      console.error('序列重置脚本执行失败:', error);
      process.exit(1);
    });
}

// 导出函数供其他模块使用
export { resetSequence }; 