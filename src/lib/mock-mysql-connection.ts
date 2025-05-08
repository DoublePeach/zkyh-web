/**
 * @description MySQL数据库模拟连接 - 用于本地测试护理助手APP集成
 * @author 郝桃桃
 * @date 2024-09-29
 */

// 模拟护理助手用户数据库
const mockUsers = [
  { 
    id: '1001', 
    name: '张三', 
    phone: '13800000001', 
    title: '护士', 
    hospital: '北京协和医院',
    department: '内科',
    created_at: new Date('2023-01-15').toISOString()
  },
  { 
    id: '1002', 
    name: '李四', 
    phone: '13800000002', 
    title: '主管护师', 
    hospital: '上海瑞金医院',
    department: '外科',
    created_at: new Date('2023-02-20').toISOString() 
  },
  { 
    id: '1003', 
    name: '王五', 
    phone: '13800000003', 
    title: '护师', 
    hospital: '广州南方医院',
    department: '儿科',
    created_at: new Date('2023-03-10').toISOString()
  },
];

/**
 * @description 根据用户ID从模拟数据库获取护理助手用户信息
 * @param userId 护理助手用户ID
 * @returns 用户信息
 */
export const getNursingAssistantUser = async (userId: string) => {
  try {
    // 模拟数据库查询延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 查找用户
    const user = mockUsers.find(user => user.id === userId);
    
    // 如果用户ID是数字但不在预设列表中，生成一个动态用户
    if (!user && /^\d+$/.test(userId)) {
      const randomName = `测试用户${userId.slice(-4)}`;
      return {
        id: userId,
        name: randomName,
        phone: `138${userId.padStart(8, '0')}`,
        title: '护士',
        hospital: '测试医院',
        department: '测试科室',
        created_at: new Date().toISOString()
      };
    }
    
    return user || null;
  } catch (error) {
    console.error('获取模拟护理助手用户信息失败:', error);
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
    // 对于模拟环境，我们认为所有数字ID都是有效的
    if (/^\d+$/.test(userId)) {
      return true;
    }
    
    const user = await getNursingAssistantUser(userId);
    return !!user;
  } catch (error) {
    console.error('验证模拟护理助手用户失败:', error);
    return false;
  }
}; 