/**
 * @description 模拟护理助手APP登录的工具脚本
 * @author 郝桃桃
 * @date 2024-09-29
 */
const axios = require('axios');
const readline = require('readline');
const crypto = require('crypto');

// 创建命令行交互
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 模拟护理助手用户数据库
const mockUsers = [
  { id: '1001', name: '张三', phone: '13800000001', title: '护士', hospital: '北京协和医院' },
  { id: '1002', name: '李四', phone: '13800000002', title: '主管护师', hospital: '上海瑞金医院' },
  { id: '1003', name: '王五', phone: '13800000003', title: '护师', hospital: '广州南方医院' },
];

// 显示可用模拟用户
function showMockUsers() {
  console.log('\n可用模拟用户:');
  console.log('--------------------------------------');
  mockUsers.forEach(user => {
    console.log(`ID: ${user.id}, 姓名: ${user.name}, 职称: ${user.title}, 医院: ${user.hospital}`);
  });
  console.log('--------------------------------------\n');
}

// 生成随机用户ID
function generateRandomUserId() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// 模拟护理助手APP登录
async function simulateLogin(userId, apiUrl) {
  try {
    // 添加时间戳和简单签名，模拟真实情况下的安全验证
    const timestamp = Date.now().toString();
    const signature = crypto
      .createHash('md5')
      .update(`${userId}${timestamp}secret_key`)
      .digest('hex');

    console.log(`\n正在使用用户ID [${userId}] 发送登录请求到 ${apiUrl}...`);

    // 发送API请求
    const response = await axios.post(apiUrl, {
      userId,
      timestamp,
      signature
    });

    // 显示响应结果
    console.log('\n请求成功! 响应结果:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // 保存cookie信息
    if (response.headers['set-cookie']) {
      console.log('\nCookie信息:');
      console.log(response.headers['set-cookie']);
    }
    
    console.log('\n可以使用以下URL在浏览器中测试:');
    console.log(`http://localhost:3000?nursing_assistant_user_id=${userId}`);
  } catch (error) {
    console.error('\n请求失败:', error.response ? error.response.data : error.message);
  }
}

// 主函数
async function main() {
  // 显示可用模拟用户
  showMockUsers();
  
  // 询问用户使用哪个ID
  rl.question('请选择用户ID (输入列表中的ID，或输入 "random" 生成随机ID): ', async (answer) => {
    let userId;
    
    if (answer.toLowerCase() === 'random') {
      userId = generateRandomUserId();
      console.log(`已生成随机用户ID: ${userId}`);
    } else {
      userId = answer;
    }
    
    // 询问API地址
    rl.question('请输入API地址 (默认: http://localhost:3000/api/auth/nursing-assistant): ', async (apiUrl) => {
      const url = apiUrl || 'http://localhost:3000/api/auth/nursing-assistant';
      
      // 执行模拟登录
      await simulateLogin(userId, url);
      
      // 关闭readline接口
      rl.close();
    });
  });
}

// 执行主函数
main(); 