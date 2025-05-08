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
    
    let lastError: Error | null = null;
    
    // 尝试请求，最多重试指定次数
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`API请求尝试 ${i + 1}/${retries}...`);
        const response = await fetch(url, fetchOptions);
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
        await new Promise(r => setTimeout(r, retryDelay));
      }
    }
    
    // 所有重试都失败
    clearTimeout(timeoutId);
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
    console.log('使用模型:', model);
    
    // 准备请求体
    const requestBody = {
      model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature,
      max_tokens: maxTokens
    };
    
    // 构建请求头
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_CONFIG.DEEPSEEK_API_KEY}`
    };
    
    // 发送请求
    const response = await fetchWithRetry(
      AI_CONFIG.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1/chat/completions',
      {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      }
    );
    
    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
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
    
    // 解析JSON
    try {
      return JSON.parse(contentText) as AIResponseData;
    } catch (parseError) {
      console.error('解析DeepSeek响应JSON失败:', parseError);
      throw new Error(`解析DeepSeek响应失败: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
  } catch (error) {
    console.error('DeepSeek API调用失败:', error);
    throw new Error(`DeepSeek API调用失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * @description 调用最合适的AI API
 * @param {string} prompt - 提示词
 * @returns {Promise<AIResponseData>} - AI响应数据
 */
export async function callAIAPI(prompt: string): Promise<AIResponseData> {
  // 根据默认提供者选择使用哪个API
  const provider = AI_CONFIG.DEFAULT_PROVIDER || 'deepseek';
  
  try {
    if (provider === 'deepseek') {
      return await callDeepSeekAPI(prompt);
    } else {
      return await callOpenAIAPI(prompt);
    }
  } catch (error) {
    // 如果默认提供者失败，尝试使用另一个提供者
    console.error(`${provider} API调用失败，尝试使用备选方案...`);
    
    try {
      if (provider === 'deepseek') {
        return await callOpenAIAPI(prompt);
      } else {
        return await callDeepSeekAPI(prompt);
      }
    } catch (fallbackError) {
      console.error('备选方案也失败:', fallbackError);
      throw new Error('所有AI API调用方式均失败');
    }
  }
} 