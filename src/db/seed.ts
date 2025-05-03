/**
 * @description 数据库种子数据
 * @author 郝桃桃
 * @date 2024-05-24
 */
import 'dotenv/config';
import { db } from './index';
import { adminUsers } from './schema';

async function seed() {
  try {
    console.log('开始添加种子数据...');

    // 检查是否已存在管理员账户
    const existingAdmin = await db.query.adminUsers.findFirst({
      where: (users, { eq }) => eq(users.username, 'admin'),
    });

    if (!existingAdmin) {
      // 添加默认管理员账户
      await db.insert(adminUsers).values({
        username: 'admin',
        password: 'admin123', // 实际项目中应该使用加密的密码
        name: '超级管理员',
        email: 'admin@example.com',
        role: 'super_admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('创建默认管理员账户成功');
    } else {
      console.log('管理员账户已存在，跳过创建');
    }

    console.log('种子数据添加完成');
  } catch (error) {
    console.error('添加种子数据失败:', error);
  } finally {
    process.exit(0);
  }
}

seed(); 