/**
 * @description 数据库迁移脚本
 * @author 郝桃桃
 * @date 2024-05-23
 */
import 'dotenv/config';
import { runMigrations } from './index';

// 执行数据库迁移
async function main() {
  console.log('开始执行数据库迁移...');
  await runMigrations();
  console.log('数据库迁移完成');
  process.exit(0);
}

main().catch((error) => {
  console.error('迁移过程中发生错误:', error);
  process.exit(1);
}); 