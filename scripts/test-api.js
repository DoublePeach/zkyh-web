/**
 * @description DeepSeek API测试脚本
 * @author 郝桃桃
 * @date 2024-09-30
 */

// 使用Node.js原生fetch API
async function testDeepSeekApi() {
  try {
    // 从环境变量或.env文件中获取API密钥
    const apiKey = process.env.DEEPSEEK_API_KEY || 'sk-ed222c4e2fcc4a64af6b3692e29cf443';
    console.log('使用API密钥:', apiKey.substring(0, 10) + '***');
    
    // 准备请求体
    const requestBody = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: '你好，请简单回答一下：1+1等于几？'
        }
      ],
      temperature: 0.3,
      max_tokens: 50
    };
    
    // 构建请求头
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    
    // 发送请求
    console.log('开始API请求...');
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    // 检查响应状态
    console.log('响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API请求失败:', errorText);
      return;
    }
    
    // 解析响应数据
    const data = await response.json();
    console.log('API响应成功:');
    console.log(JSON.stringify(data, null, 2));
    
    // 提取模型回答
    if (data.choices && data.choices[0] && data.choices[0].message) {
      console.log('\n模型回答:');
      console.log(data.choices[0].message.content);
    }
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 执行测试
testDeepSeekApi(); 