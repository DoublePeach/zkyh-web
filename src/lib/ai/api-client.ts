/**
 * @description AI API调用客户端
 * @author 郝桃桃
 * @date 2024-09-29
 */
import { OpenAI } from 'openai';
import { AI_CONFIG } from '@/lib/config';

// API响应数据结构类型定义
export interface AIResponseData {
  overview: string;
  phases: Array<{
    id: number;
    name: string;
    description: string;
    startDay: number;
    endDay: number;
    focusAreas: string[];
    learningGoals: string[];
    recommendedResources: string[];
    monthlyPlan?: string;
  }>;
  dailyPlans: Array<{
    day: number;
    date: string;
    phaseId: number;
    title: string;
    subjects: string[];
    tasks: Array<{
      title: string;
      description: string;
      duration: number;
      resources: string[];
    }>;
    reviewTips: string;
  }>;
  nextSteps?: string;
}

/**
 * @description 带有重试机制的fetch函数
 * @param {string} url - 请求URL
 * @param {RequestInit} options - fetch选项
 * @param {number} retries - 重试次数
 * @param {number} retryDelay - 重试延迟(ms)
 * @param {number} timeout - 超时时间(ms)
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  retryDelay = 1000,
  timeout = 30000
): Promise<Response> {
  return new Promise(async (resolve, reject) => {
    // 设置超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // 添加signal到options
    const fetchOptions = {
      ...options,
      signal: controller.signal,
    };
    
    // 调试：输出请求信息
    console.log('发送请求到:', url);
    if (options.headers && 'Authorization' in options.headers) {
      const auth = options.headers['Authorization'] as string;
      console.log('Authorization头前15字符:', auth.substring(0, 15) + '***');
    }
    
    let lastError: Error | null = null;
    
    // 尝试请求，最多重试指定次数
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`API请求尝试 ${i + 1}/${retries}...`);
        
        // 直接用Node.js的fetch API发送请求
        const response = await fetch(url, fetchOptions);
        
        // 即使是错误响应也先返回，由调用者处理
        clearTimeout(timeoutId);
        resolve(response);
        return;
      } catch (error) {
        console.error(`API请求失败 (尝试 ${i + 1}/${retries}):`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // 如果已达到最大重试次数或是被用户取消的请求，不再重试
        if (i === retries - 1 || (error instanceof Error && error.name === 'AbortError')) {
          break;
        }
        
        // 等待一段时间后重试
        console.log(`等待 ${retryDelay}ms 后重试...`);
        await new Promise(r => setTimeout(r, retryDelay));
      }
    }
    
    // 所有重试都失败
    clearTimeout(timeoutId);
    console.error('所有API请求尝试都失败，最后错误:', lastError);
    reject(lastError || new Error('所有API请求尝试都失败'));
  });
}

/**
 * @description 使用OpenAI API发送请求
 * @param {string} prompt - 提示词
 * @param {string} model - 模型名称
 * @param {number} temperature - 温度参数
 * @param {number} maxTokens - 最大生成令牌数
 * @returns {Promise<AIResponseData>} - AI响应数据
 */
export async function callOpenAIAPI(
  prompt: string,
  model: string = AI_CONFIG.DEFAULT_MODEL,
  temperature: number = 0.3,
  maxTokens: number = 8000
): Promise<AIResponseData> {
  try {
    console.log('准备调用OpenAI API...');
    console.log('使用模型:', model);
    console.log('温度参数:', temperature);
    console.log('最大令牌数:', maxTokens);

    // 创建OpenAI客户端
    const openai = new OpenAI({
      apiKey: AI_CONFIG.CURRENT_API_KEY,
      baseURL: AI_CONFIG.CURRENT_BASE_URL
    });
    
    // 根据提供者调整端点路径
    let endpoint = '/v1/chat/completions';
    if (AI_CONFIG.DEFAULT_PROVIDER === 'deepseek') {
      endpoint = '/chat/completions';
    }
    
    console.log('使用端点:', endpoint);
    
    // 发送请求
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' }
    });
    
    // 处理响应
    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('AI模型没有返回有效内容');
    }
    
    console.log('AI响应内容长度:', responseContent.length);
    
    // 解析JSON
    try {
      return JSON.parse(responseContent) as AIResponseData;
    } catch (parseError) {
      console.error('解析AI响应JSON失败:', parseError);
      throw new Error(`解析AI响应失败: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
  } catch (error) {
    console.error('OpenAI API调用失败:', error);
    throw new Error(`AI API调用失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * @description 使用DeepSeek API发送请求
 * @param {string} prompt - 提示词
 * @param {string} model - 模型名称
 * @param {number} temperature - 温度参数
 * @param {number} maxTokens - 最大生成令牌数
 * @returns {Promise<AIResponseData>} - AI响应数据
 */
export async function callDeepSeekAPI(
  prompt: string,
  model: string = 'deepseek-chat',
  temperature: number = 0.3,
  maxTokens: number = 8000
): Promise<AIResponseData> {
  try {
    console.log('准备调用DeepSeek API...');
    
    // 使用正确的模型名称 - DeepSeek Chat模型名称格式
    // 可用模型包括：deepseek-chat, deepseek-coder等
    const actualModel = model === 'deepseek-chat' ? 'deepseek-chat' : model;
    console.log('使用模型:', actualModel);
    
    // 直接使用硬编码密钥，不依赖配置和环境变量
    // 公司内部密钥，用于特定项目
    const apiKey = 'sk-ed222c4e2fcc4a64af6b3692e29cf443';
    
    // 记录完整的API密钥前几位(仅用于调试)
    console.log('完整API密钥前10位:', apiKey.substring(0, 10) + '***');
    
    // 准备请求体
    const requestBody = {
      model: actualModel,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature,
      max_tokens: maxTokens,
      // 添加响应格式设置，强制返回JSON
      response_format: { type: "json_object" }
    };
    
    // 构建请求头
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    
    // 打印API配置信息 (脱敏API密钥)
    console.log('使用Authorization头:', `Bearer ${apiKey.substring(0, 10)}***`);
    
    // 固定使用官方的API URL格式
    // DeepSeek的标准端点为 https://api.deepseek.com/chat/completions
    const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    
    console.log('开始API请求...');
    console.log('API请求配置 (部分):', JSON.stringify({
      url: apiUrl,
      method: 'POST',
      model: actualModel,
      temperature,
      max_tokens: maxTokens,
      message_prompt_length_chars: prompt.length
    }));
    
    // 发送请求 - 直接使用fetch而不是fetchWithRetry
    console.log('执行 Deepseek API 调用...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    // 检查响应状态
    console.log('API响应状态码:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API返回错误状态码:', response.status);
      console.error('错误详情:', errorText);
      throw new Error(`DeepSeek API请求失败: ${response.status} ${response.statusText}, ${errorText}`);
    }
    
    // 解析响应数据
    const responseData = await response.json();
    
    // 检查响应结构
    if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message || !responseData.choices[0].message.content) {
      throw new Error('DeepSeek API返回了不正确的数据格式');
    }
    
    const contentText = responseData.choices[0].message.content;
    console.log('AI响应内容长度:', contentText.length);
    
    // 打印前100个字符用于调试
    console.log('AI响应内容前100个字符:', contentText.substring(0, 100));
    
    // 解析JSON响应，处理多种可能的格式
    return parseJsonResponse(contentText);
  } catch (error) {
    console.error('DeepSeek API调用失败:', error);
    throw new Error(`DeepSeek API调用失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * @description 解析JSON响应，支持多种可能的格式
 * @param {string} contentText - 响应文本内容
 * @returns {AIResponseData} - 解析后的数据
 */
function parseJsonResponse(contentText: string): AIResponseData {
  try {
    // 处理步骤：
    // 1. 尝试直接解析
    // 2. 如果失败，尝试从Markdown代码块中提取
    // 3. 如果失败，尝试使用正则表达式提取
    // 4. 如果仍然失败，尝试修复常见错误后解析
    
    // 记录原始内容长度与结构
    console.log('解析JSON响应，内容长度:', contentText.length);
    console.log('响应内容起始字符:', contentText.substring(0, 30).replace(/\n/g, '\\n'));
    console.log('响应内容结束字符:', contentText.substring(contentText.length - 30).replace(/\n/g, '\\n'));
    
    // 步骤1: 尝试直接解析
    try {
      return JSON.parse(contentText) as AIResponseData;
    } catch (directParseError) {
      console.log('直接解析JSON失败, 尝试其他方法:', directParseError instanceof Error ? directParseError.message : String(directParseError));
    }
    
    // 步骤2: 从Markdown代码块中提取JSON
    if (contentText.includes('```')) {
      console.log('检测到可能的Markdown代码块，尝试提取...');
      
      // 寻找JSON代码块
      const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
      const match = contentText.match(jsonBlockRegex);
      
      if (match && match[1]) {
        const extractedJson = match[1].trim();
        console.log('从Markdown代码块提取的JSON长度:', extractedJson.length);
        
        try {
          return JSON.parse(extractedJson) as AIResponseData;
        } catch (blockParseError) {
          console.log('解析Markdown代码块中的JSON失败:', blockParseError instanceof Error ? blockParseError.message : String(blockParseError));
        }
      } else {
        console.log('未找到有效的Markdown JSON代码块');
      }
    }
    
    // 步骤3: 使用正则表达式尝试提取JSON对象
    console.log('尝试使用正则表达式提取JSON对象...');
    const jsonRegex = /(\{[\s\S]*\})/;
    const jsonMatch = contentText.match(jsonRegex);
    
    if (jsonMatch && jsonMatch[1]) {
      const jsonCandidate = jsonMatch[1];
      console.log('正则提取的潜在JSON长度:', jsonCandidate.length);
      
      try {
        return JSON.parse(jsonCandidate) as AIResponseData;
      } catch (regexParseError) {
        console.log('解析正则提取的JSON失败:', regexParseError instanceof Error ? regexParseError.message : String(regexParseError));
      }
    }
    
    // 步骤4: 尝试修复常见JSON错误
    console.log('尝试修复常见JSON格式错误...');
    
    // 去除非法控制字符
    let cleanedContent = contentText.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');
    
    // 尝试移除或修复常见分隔符问题
    cleanedContent = cleanedContent.replace(/,\s*}/, '}').replace(/,\s*]/, ']');
    
    // 尝试找到最外层的 { }
    const openBrace = cleanedContent.indexOf('{');
    const closeBrace = cleanedContent.lastIndexOf('}');
    
    if (openBrace !== -1 && closeBrace !== -1 && openBrace < closeBrace) {
      const extractedJson = cleanedContent.substring(openBrace, closeBrace + 1);
      console.log('提取到最外层大括号内容，长度:', extractedJson.length);
      
      try {
        return JSON.parse(extractedJson) as AIResponseData;
      } catch (fixedParseError) {
        console.log('解析修复后的JSON仍然失败:', fixedParseError instanceof Error ? fixedParseError.message : String(fixedParseError));
      }
    }
    
    // 所有解析方法都失败，抛出最详细的错误
    console.error('无法解析JSON响应，所有尝试都失败');
    console.error('响应内容片段:', contentText.substring(0, 200) + '...');
    throw new Error('无法解析API响应为有效的JSON格式');
  } catch (error) {
    console.error('JSON解析过程中发生错误:', error);
    throw new Error(`解析JSON响应失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * @description 调用最合适的AI API
 * @param {string} prompt - 提示词
 * @returns {Promise<AIResponseData>} - AI响应数据
 */
export async function callAIAPI(prompt: string): Promise<AIResponseData> {
  // 打印API配置信息
  console.log('API配置信息:');
  console.log('- DEFAULT_PROVIDER:', AI_CONFIG.DEFAULT_PROVIDER);
  console.log('- DEFAULT_MODEL:', AI_CONFIG.DEFAULT_MODEL);
  console.log('- CURRENT_API_KEY (前10位):', AI_CONFIG.CURRENT_API_KEY?.substring(0, 10) + '***');
  console.log('- CURRENT_BASE_URL:', AI_CONFIG.CURRENT_BASE_URL);
  console.log('- DEEPSEEK_API_KEY (前10位):', AI_CONFIG.DEEPSEEK_API_KEY?.substring(0, 10) + '***');
  console.log('- DEEPSEEK_BASE_URL:', AI_CONFIG.DEEPSEEK_BASE_URL);
  
  // 根据默认提供者选择使用哪个API
  const provider = AI_CONFIG.DEFAULT_PROVIDER || 'deepseek';
  
  try {
    console.log('开始调用AI生成备考规划...');
    
    // 先尝试直接使用DeepSeek API
    try {
      console.log('使用Deepseek API密钥:', AI_CONFIG.DEEPSEEK_API_KEY?.substring(0, 10) + '***');
      return await callDeepSeekAPI(prompt);
    } catch (deepseekError) {
      console.error('DeepSeek API调用失败，错误详情:', deepseekError);
      
      // 如果失败，尝试本地降级处理
      throw new Error(`DeepSeek API调用失败: ${deepseekError instanceof Error ? deepseekError.message : String(deepseekError)}`);
    }
  } catch (error) {
    // 记录详细的错误信息
    console.error('API调用失败，详细错误:');
    console.error('错误类型:', typeof error);
    console.error('错误名称:', error instanceof Error ? error.name : 'Unknown');
    console.error('错误消息:', error instanceof Error ? error.message : String(error));
    console.error('错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
    
    throw new Error(`AI API调用失败: ${error instanceof Error ? error.message : String(error)}`);
  }
} 