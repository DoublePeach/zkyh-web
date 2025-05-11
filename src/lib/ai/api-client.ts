/**
 * @description AI API调用客户端
 * @author 郝桃桃
 * @date 2024-09-29
 */
import { OpenAI } from 'openai';
import { AI_CONFIG } from '@/lib/config';
import processClaudeTruncatedStudyPlan from './processors/process-claude-truncated';
import https from 'node:https';

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
  maxTokens: number = 15000
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
    
    // 确保max_tokens在有效范围内 (DeepSeek限制为1-8192)
    const validMaxTokens = Math.min(8192, Math.max(1, maxTokens));
    console.log(`DeepSeek API - 请求的max_tokens: ${maxTokens}, 调整后的有效值: ${validMaxTokens}`);
    
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
      max_tokens: validMaxTokens,
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
      max_tokens: validMaxTokens,
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
    
    // 解析JSON响应，支持多种可能的格式，增强对不完整JSON的修复
    return parseJsonResponse(contentText);
  } catch (error) {
    console.error('DeepSeek API调用失败:', error);
    throw new Error(`DeepSeek API调用失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * @description 解析JSON响应，支持多种可能的格式，增强对不完整JSON的修复
 * @param {string} contentText - 响应文本内容
 * @param {number} knowledgePointsCount - 知识点总数，用于处理学习计划
 * @returns {AIResponseData} - 解析后的数据
 */
function parseJsonResponse(contentText: string, knowledgePointsCount: number = 30): AIResponseData {
  try {
    // 记录原始内容长度与结构
    console.log('解析JSON响应，内容长度:', contentText.length);
    console.log('响应内容起始字符:', contentText.substring(0, 30).replace(/\n/g, '\\n'));
    console.log('响应内容结束字符:', contentText.substring(contentText.length - 30).replace(/\n/g, '\\n'));
    
    // 1. 尝试直接解析
    let parseError: unknown;
    try {
      const result = JSON.parse(contentText) as AIResponseData;
      console.log('✅ 成功直接解析JSON');
      
      // 检查Daily Plans数量，如果少于30天，使用后处理函数补全
      if (!result.dailyPlans || result.dailyPlans.length < 30) {
        console.log(`返回的Daily Plans数量不足(${result.dailyPlans?.length || 0}天)，将补全到30天`);
        return processClaudeTruncatedStudyPlan(contentText, knowledgePointsCount, 30);
      }
      
      return result;
    } catch (directParseError) {
      parseError = directParseError;
      console.log('直接解析JSON失败, 尝试其他方法:', directParseError instanceof Error ? directParseError.message : String(directParseError));
    }
    
    // 2. 从Markdown代码块中提取JSON
    if (contentText.includes('```')) {
      console.log('检测到可能的Markdown代码块，尝试提取...');
      
      const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
      const match = contentText.match(jsonBlockRegex);
      
      if (match && match[1]) {
        const extractedJson = match[1].trim();
        console.log('从Markdown代码块提取的JSON长度:', extractedJson.length);
        
        try {
          const result = JSON.parse(extractedJson) as AIResponseData;
          console.log('✅ 成功从Markdown代码块解析JSON');
          
          // 检查Daily Plans数量
          if (!result.dailyPlans || result.dailyPlans.length < 30) {
            console.log(`从Markdown提取的Daily Plans数量不足(${result.dailyPlans?.length || 0}天)，将补全到30天`);
            return processClaudeTruncatedStudyPlan(extractedJson, knowledgePointsCount, 30);
          }
          
          return result;
        } catch (blockParseError) {
          console.log('解析Markdown代码块中的JSON失败:', blockParseError instanceof Error ? blockParseError.message : String(blockParseError));
        }
      } else {
        console.log('未找到有效的Markdown JSON代码块');
      }
    }
    
    // 3. 使用正则表达式尝试提取JSON对象
    console.log('尝试使用正则表达式提取JSON对象...');
    const jsonRegex = /(\{[\s\S]*\})/;
    const jsonMatch = contentText.match(jsonRegex);
    
    if (jsonMatch && jsonMatch[1]) {
      const jsonCandidate = jsonMatch[1];
      console.log('正则提取的潜在JSON长度:', jsonCandidate.length);
      
      try {
        const result = JSON.parse(jsonCandidate) as AIResponseData;
        console.log('✅ 成功通过正则表达式解析JSON');
        
        // 检查Daily Plans数量
        if (!result.dailyPlans || result.dailyPlans.length < 30) {
          console.log(`正则提取的Daily Plans数量不足(${result.dailyPlans?.length || 0}天)，将补全到30天`);
          return processClaudeTruncatedStudyPlan(jsonCandidate, knowledgePointsCount, 30);
        }
        
        return result;
      } catch (regexParseError) {
        console.log('解析正则提取的JSON失败:', regexParseError instanceof Error ? regexParseError.message : String(regexParseError));
      }
    }
    
    // 4. 尝试修复常见JSON格式错误
    console.log('尝试修复常见JSON格式错误...');
    
    // 4.1 尝试识别和修复特定的截断情况
    const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
    
    // 根据错误信息判断截断类型
    if (errorMessage.includes('Unterminated string') || errorMessage.includes('Expected')) {
      console.log('检测到可能的JSON截断问题，尝试使用专门的学习计划处理函数...');
      return processClaudeTruncatedStudyPlan(contentText, knowledgePointsCount, 30);
    }
    
    // 5. 尝试提取部分有效数据(通过processClaudeTruncatedStudyPlan)
    console.log('尝试提取部分有效数据并补全...');
    const processedData = processClaudeTruncatedStudyPlan(contentText, knowledgePointsCount, 30);
    
    if (processedData.overview && 
        (processedData.phases.length > 0 || processedData.dailyPlans.length > 0)) {
      console.log('成功通过特殊处理提取并补全数据:');
      console.log('- overview长度:', processedData.overview.length);
      console.log('- phases数量:', processedData.phases?.length || 0);
      console.log('- dailyPlans数量:', processedData.dailyPlans?.length || 0);
      return processedData;
    }
    
    // 所有尝试都失败，记录错误并返回默认响应
    console.error('无法解析JSON响应，所有尝试都失败');
    console.error('响应内容片段:', contentText.substring(0, 200) + '...');
    
    // 返回至少包含必要字段的最小响应
    return {
      overview: '无法解析AI生成的学习计划。请稍后再试或联系客服。',
      phases: [],
      dailyPlans: []
    };
  } catch (error) {
    console.error('JSON解析过程中发生错误:', error);
    // 不再抛出错误，而是返回最小可用的响应
    return {
      overview: '处理AI响应时发生错误。请稍后再试或联系客服。',
      phases: [],
      dailyPlans: []
    };
  }
}

/**
 * @description 使用OpenRouter API调用Claude 3.7 Sonnet
 * @param {string} prompt - 提示词
 * @param {string} model - 模型名称
 * @param {number} temperature - 温度参数
 * @param {number} maxTokens - 最大生成令牌数
 * @param {number} knowledgePointsCount - 知识点总数
 * @returns {Promise<AIResponseData>} - AI响应数据
 */
export async function callOpenRouterAPI(
  prompt: string,
  model: string = 'anthropic/claude-3.7-sonnet',
  temperature: number = 0.3,
  maxTokens: number = 20000,
  knowledgePointsCount: number = 30
): Promise<AIResponseData> {
  try {
    console.log('准备调用OpenRouter API (Claude 3.7 Sonnet)...');
    console.log('使用模型:', model);
    console.log('温度参数:', temperature);
    console.log('最大令牌数:', maxTokens);
    
    // 确保max_tokens在有效范围内 (Claude一般支持很大范围，采用保守值)
    const validMaxTokens = Math.min(32000, Math.max(1, maxTokens));
    if (validMaxTokens !== maxTokens) {
      console.log(`OpenRouter API - 请求的max_tokens: ${maxTokens}, 调整后的有效值: ${validMaxTokens}`);
    }
    
    // 检测提示词中是否有中文或其他Unicode字符
    const hasNonAsciiChars = /[^\x00-\x7F]/.test(prompt);
    if (hasNonAsciiChars) {
      console.log('检测到提示词包含非ASCII字符（如中文），进行特殊编码处理...');
      
      // 使用TextEncoder确保字符被正确编码为UTF-8
      try {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(prompt);
        const decoder = new TextDecoder('utf-8');
        prompt = decoder.decode(encoded);
        console.log('已完成UTF-8编码处理，确保中文字符兼容性');
      } catch (encodingError) {
        console.warn('UTF-8编码处理失败，将继续使用原始提示词:', encodingError);
      }
    }
    
    // 估算输入token数量，避免超过模型限制
    const estimatedInputTokens = Math.ceil(prompt.length / 3.5); // 粗略估计
    console.log(`估计输入token数量: ~${estimatedInputTokens}`);
    if (estimatedInputTokens > 150000) {
      console.warn(`⚠️ 输入可能接近或超过Claude 3.7 Sonnet的200K上下文限制`);
    }
    
    // 获取API密钥
    const apiKey = AI_CONFIG.OPENROUTER_API_KEY;
    console.log('OpenRouter API密钥前10位:', apiKey.substring(0, 10) + '***');
    
    // 准备请求体 
    const requestBody = {
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature,
      max_tokens: validMaxTokens,
      response_format: { type: "json_object" }
    };
    
    // 将requestBody转换为JSON字符串
    const requestBodyString = JSON.stringify(requestBody);
    
    // 构建请求头 - 移除所有非ASCII字符，防止HTTP头错误
    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': `Bearer ${apiKey}`,
    };
    
    // 确保referer不包含非ASCII字符
    if (!/[^\u0000-\u007F]/.test('https://zkyh.cn')) {
      headers['HTTP-Referer'] = 'https://zkyh.cn';
    }
    
    // OpenRouter的API端点
    const apiUrl = `${AI_CONFIG.OPENROUTER_BASE_URL}/chat/completions`;
    
    console.log('开始API请求...');
    console.log('API请求配置 (部分):', JSON.stringify({
      url: apiUrl,
      method: 'POST',
      model: model,
      temperature,
      max_tokens: validMaxTokens,
      message_prompt_length_chars: prompt.length
    }));
    
    // 使用Node.js原生HTTP/HTTPS模块发送请求，避免编码问题
    console.log('执行OpenRouter API调用...');
    
    // 创建Promise包装的HTTP请求
    return new Promise((resolve, reject) => {
      try {
        const url = new URL(apiUrl);
        
        // 创建请求选项
        const options = {
          hostname: url.hostname,
          path: url.pathname + url.search,
          method: 'POST',
          headers: headers,
          timeout: 120000 // 2分钟超时
        };
        
        console.log('发送的HTTP头:', JSON.stringify(headers));
        
        // 创建请求
        const req = https.request(options, (res: any) => {
          // let data = ''; // Removed unused variable
          const chunks: Buffer[] = [];
          
          // 接收二进制数据，避免字符编码问题
          res.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });
          
          // 完成接收
          res.on('end', () => {
            console.log('API响应状态码:', res.statusCode);
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                // 将二进制数据合并，并以UTF-8解码
                const buffer = Buffer.concat(chunks);
                const responseText = buffer.toString('utf-8');
                
                // 解析JSON响应
                const responseData = JSON.parse(responseText);
                
                // 检查响应结构
                if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message || !responseData.choices[0].message.content) {
                  return reject(new Error('OpenRouter API返回了不正确的数据格式'));
                }
                
                const contentText = responseData.choices[0].message.content;
                console.log('AI响应内容长度:', contentText.length);
                
                // 打印前100个字符用于调试
                console.log('AI响应内容前100个字符:', contentText.substring(0, 100));
                
                // 解析JSON响应，传递知识点数量
                resolve(parseJsonResponse(contentText, knowledgePointsCount));
              } catch (parseError) {
                reject(new Error(`解析OpenRouter响应失败: ${parseError instanceof Error ? parseError.message : String(parseError)}`));
              }
            } else {
              // 对于错误响应，尝试解析错误详情
              try {
                const buffer = Buffer.concat(chunks);
                const errorText = buffer.toString('utf-8');
                reject(new Error(`OpenRouter API请求失败: ${res.statusCode} ${res.statusMessage}, ${errorText}`));
              } catch /* (errorParseError) */ {
                reject(new Error(`OpenRouter API请求失败: ${res.statusCode} ${res.statusMessage}`));
              }
            }
          });
        });
        
        // 处理错误
        req.on('error', (error: any) => {
          console.error('OpenRouter请求错误:', error);
          reject(error);
        });
        
        // 设置超时 (2分钟)
        req.setTimeout(120000, () => {
          req.destroy();
          reject(new Error('OpenRouter API请求超时(120秒)'));
        });
        
        // 发送请求体
        req.write(requestBodyString);
        req.end();
      } catch (requestError: any) {
        console.error('创建HTTP请求失败:', requestError);
        reject(new Error(`创建HTTP请求失败: ${requestError.message}`));
      }
    });
  } catch (error) {
    console.error('OpenRouter API调用失败:', error);
    throw new Error(`OpenRouter API调用失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * @description 调用最合适的AI API
 * @param {string} prompt - 提示词
 * @param {number} knowledgePointsCount - 知识点总数，用于处理学习计划
 * @returns {Promise<AIResponseData>} - AI响应数据
 */
export async function callAIAPI(prompt: string, knowledgePointsCount: number = 30): Promise<AIResponseData> {
  // 强制设置默认使用OpenRouter和Claude模型
  const FORCE_USE_CLAUDE = true;
  
  // 打印API配置信息
  console.log('API配置信息:');
  console.log('- DEFAULT_PROVIDER:', FORCE_USE_CLAUDE ? 'openrouter' : AI_CONFIG.DEFAULT_PROVIDER);
  console.log('- DEFAULT_MODEL:', FORCE_USE_CLAUDE ? 'anthropic/claude-3.7-sonnet' : AI_CONFIG.DEFAULT_MODEL);
  console.log('- OPENROUTER_API_KEY (前10位):', AI_CONFIG.OPENROUTER_API_KEY?.substring(0, 10) + '***');
  console.log('- OPENROUTER_BASE_URL:', AI_CONFIG.OPENROUTER_BASE_URL);
  console.log('- DEEPSEEK_API_KEY (前10位):', AI_CONFIG.DEEPSEEK_API_KEY?.substring(0, 10) + '***');
  console.log('- DEEPSEEK_BASE_URL:', AI_CONFIG.DEEPSEEK_BASE_URL);
  
  // 设置默认提供者
  const provider = FORCE_USE_CLAUDE ? 'openrouter' : (AI_CONFIG.DEFAULT_PROVIDER || 'openrouter');
  console.log(`✅ 使用AI提供商: ${provider}`);
  
  try {
    console.log('开始调用AI生成备考规划...');
    
    // 保存错误信息，用于故障处理
    let claudeError: Error | null = null;
    
    // 优先尝试使用OpenRouter API (Claude 3.7 Sonnet)
    if (provider === 'openrouter') {
      try {
        console.log('🚀 使用OpenRouter API调用Claude 3.7 Sonnet...');
        console.log('API密钥:', AI_CONFIG.OPENROUTER_API_KEY?.substring(0, 10) + '***');
        
        const response = await callOpenRouterAPI(prompt, 'anthropic/claude-3.7-sonnet', 0.3, 20000, knowledgePointsCount);
        
        // 验证数据完整性并通过特殊处理确保生成30天计划
        if (response && response.overview && 
            (Array.isArray(response.phases) || Array.isArray(response.dailyPlans))) {
          console.log('✅ Claude成功生成响应:');
          console.log('- overview长度:', response.overview.length);
          console.log('- phases数量:', response.phases?.length || 0);
          console.log('- dailyPlans数量:', response.dailyPlans?.length || 0);
          
          // 如果dailyPlans数量不足，将自动通过parseJsonResponse补充
          return response;
        } else {
          console.warn('⚠️ Claude生成的响应不完整，可能的问题:');
          console.warn('- overview存在:', !!response.overview);
          console.warn('- phases是数组:', Array.isArray(response.phases));
          console.warn('- phases数量:', response.phases?.length || 0);
          console.warn('- dailyPlans是数组:', Array.isArray(response.dailyPlans));
          console.warn('- dailyPlans数量:', response.dailyPlans?.length || 0);
          
          if (response.overview && (response.phases?.length || response.dailyPlans?.length)) {
            console.log('✓ 响应有部分有效数据，将继续使用');
            return response;
          }
          
          throw new Error('Claude生成的响应数据不完整，尝试备选模型');
        }
      } catch (openRouterError: any) {
        claudeError = openRouterError instanceof Error ? openRouterError : new Error(String(openRouterError));
        console.error('❌ OpenRouter API调用失败，错误详情:', openRouterError);
        console.log('尝试使用备选API...');
      }
    }
    
    // 如果OpenRouter调用失败或者数据不完整，尝试DeepSeek
    try {
      console.log('🔄 尝试使用DeepSeek API作为备选...');
      console.log('API密钥:', AI_CONFIG.DEEPSEEK_API_KEY?.substring(0, 10) + '***');
      
      const deepseekResponse = await callDeepSeekAPI(prompt);
      
      // 验证DeepSeek响应完整性
      if (deepseekResponse && deepseekResponse.overview && Array.isArray(deepseekResponse.phases)) {
        console.log('✅ DeepSeek成功生成响应:');
        console.log('- overview长度:', deepseekResponse.overview.length);
        console.log('- phases数量:', deepseekResponse.phases.length);
        console.log('- dailyPlans数量:', deepseekResponse.dailyPlans?.length || 0);
        
        return deepseekResponse;
      } else {
        console.warn('⚠️ DeepSeek生成的响应不完整');
        
        // 如果有一部分数据，也返回
        if (deepseekResponse.overview) {
          return deepseekResponse;
        }
        
        throw new Error('DeepSeek生成的响应数据不完整');
      }
    } catch (deepseekError: any) {
      console.error('❌ DeepSeek API调用也失败，错误详情:', deepseekError);
      
      // 如果两者都失败，提供更详细的错误信息
      const errorMessage = `AI API调用失败: Claude错误 - ${claudeError?.message || 'Unknown'}, DeepSeek错误 - ${deepseekError instanceof Error ? deepseekError.message : String(deepseekError)}`;
      console.error(errorMessage);
      
      // 返回一个基本的错误响应，避免抛出异常
      return {
        overview: '生成学习计划时发生错误。我们的AI服务暂时不可用，请稍后再试。如果问题持续存在，请联系客服。',
        phases: [],
        dailyPlans: []
      };
    }
  } catch (error: any) {
    // 记录详细的错误信息
    console.error('API调用失败，详细错误:');
    console.error('错误类型:', typeof error);
    console.error('错误名称:', error instanceof Error ? error.name : 'Unknown');
    console.error('错误消息:', error instanceof Error ? error.message : String(error));
    console.error('错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
    
    // 返回一个基本的错误响应，避免抛出异常
    return {
      overview: '生成学习计划时发生错误。请稍后再试或联系客服。',
      phases: [],
      dailyPlans: []
    };
  }
} 