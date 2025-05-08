/**
 * @description 测试Markdown格式JSON解析
 * @author 郝桃桃
 * @date 2024-09-30
 */

// 模拟从API返回的带Markdown的JSON
const markdownJsonContent = `\`\`\`json
{
  "overview": "这是一个测试规划",
  "phases": [
    {
      "id": 1,
      "name": "基础学习阶段",
      "description": "掌握基础知识",
      "startDay": 1,
      "endDay": 30,
      "focusAreas": ["基础医学", "护理学基础"],
      "learningGoals": ["目标1", "目标2"],
      "recommendedResources": ["资源1", "资源2"]
    }
  ],
  "dailyPlans": [
    {
      "day": 1,
      "date": "2024-10-01",
      "phaseId": 1,
      "title": "第1天学习计划",
      "subjects": ["护理学基础"],
      "tasks": [
        {
          "title": "学习任务1",
          "description": "任务描述",
          "duration": 60,
          "resources": ["资源链接"]
        }
      ],
      "reviewTips": "复习提示"
    }
  ]
}
\`\`\``;

console.log('原始内容:');
console.log(markdownJsonContent);

// 尝试各种解析方法
console.log('\n=== 测试直接解析 ===');
try {
  const result1 = JSON.parse(markdownJsonContent);
  console.log('直接解析成功:', result1);
} catch (error) {
  console.error('直接解析失败:', error.message);
}

console.log('\n=== 测试Markdown处理 ===');
try {
  let jsonText = markdownJsonContent;
  
  // 移除可能的Markdown代码块格式
  if (jsonText.startsWith('```')) {
    // 找到第一个和最后一个```
    const firstBlockEnd = jsonText.indexOf('\n', 3);
    const lastBlock = jsonText.lastIndexOf('```');
    
    if (firstBlockEnd !== -1 && lastBlock !== -1) {
      // 提取代码块中间的内容
      jsonText = jsonText.substring(firstBlockEnd + 1, lastBlock).trim();
      console.log('提取的JSON长度:', jsonText.length);
      console.log('提取的JSON前50个字符:', jsonText.substring(0, 50));
    }
  }
  
  // 重新尝试解析
  const result2 = JSON.parse(jsonText);
  console.log('Markdown处理后解析成功:', JSON.stringify(result2).substring(0, 100) + '...');
} catch (error) {
  console.error('Markdown处理解析失败:', error.message);
}

console.log('\n=== 测试正则表达式提取 ===');
try {
  const jsonMatch = markdownJsonContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const extractedJson = jsonMatch[0];
    console.log('正则提取的JSON长度:', extractedJson.length);
    
    const result3 = JSON.parse(extractedJson);
    console.log('正则提取解析成功:', JSON.stringify(result3).substring(0, 100) + '...');
  } else {
    console.log('未找到JSON对象');
  }
} catch (error) {
  console.error('正则提取解析失败:', error.message);
} 