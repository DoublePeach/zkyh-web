/**
 * @description 测试环境变量加载
 * @author 郝桃桃
 * @date 2024-09-30
 */

// 在Node.js中加载.env文件
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  console.log('dotenv库未安装，跳过.env文件加载');
  console.log('如需加载.env文件，请运行: npm install dotenv');
}

console.log('环境变量测试:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? 
  `${process.env.DEEPSEEK_API_KEY.substring(0, 10)}***` : 'undefined');
console.log('DEFAULT_PROVIDER:', process.env.DEFAULT_PROVIDER);
console.log('DEFAULT_MODEL:', process.env.DEFAULT_MODEL);
console.log('AI_DEBUG:', process.env.AI_DEBUG);

// 测试环境变量是否包含非打印字符
if (process.env.DEEPSEEK_API_KEY) {
  const key = process.env.DEEPSEEK_API_KEY;
  console.log('\n密钥详细信息:');
  console.log('长度:', key.length);
  console.log('原始字符:', key);
  console.log('每个字符的编码:');
  for (let i = 0; i < key.length; i++) {
    const char = key[i];
    const code = char.charCodeAt(0);
    console.log(`位置 ${i}: '${char}' = ${code} (${code.toString(16)})`);
  }
}

// 创建完全纯净的API密钥，不含任何不可见字符
const cleanKey = 'sk-ed222c4e2fcc4a64af6b3692e29cf443';

async function testApiWithCleanKey() {
  console.log('\n使用纯净密钥测试API:');
  
  try {
    // 使用纯净密钥调用API
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ],
        max_tokens: 10
      })
    });
    
    console.log('响应状态:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('响应成功:', data.choices[0].message.content);
    } else {
      const text = await response.text();
      console.log('响应失败:', text);
    }
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 执行测试
testApiWithCleanKey(); 