/**
 * @description DeepSeek API直接测试脚本(无依赖)
 * @author 郝桃桃
 * @date 2024-09-30
 */

// 完全不依赖任何配置，直接使用硬编码值测试
async function directApiTest() {
  try {
    console.log('----- DeepSeek API直接测试脚本 -----');
    
    // 使用与应用中完全相同的API密钥
    const apiKey = 'sk-ed222c4e2fcc4a64af6b3692e29cf443';
    console.log('使用API密钥:', apiKey.substring(0, 10) + '***');
    
    // 使用与应用中完全相同的API端点
    const apiUrl = 'https://api.deepseek.com/chat/completions';
    console.log('使用API端点:', apiUrl);
    
    // 使用与应用中完全相同的请求头
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    console.log('使用请求头:', JSON.stringify({
      'Content-Type': headers['Content-Type'],
      'Authorization': headers['Authorization'].substring(0, 16) + '***'
    }));
    
    // 简单的请求体
    const requestBody = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: '请简单回答: 今天天气好吗?'
        }
      ],
      temperature: 0.3,
      max_tokens: 50
    };
    
    // 发送请求
    console.log('开始API请求...');
    const response = await fetch(apiUrl, {
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
directApiTest(); 