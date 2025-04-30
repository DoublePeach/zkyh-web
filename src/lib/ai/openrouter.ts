/**
 * @description OpenRouter API service for AI model calls
 * @author HaoTaotao
 * @date 2023-10-01
 */

import { SurveyFormData } from '@/types/survey';

// OpenRouter API key
const OPENROUTER_API_KEY = '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';

// App info
const APP_URL = 'https://medical-cert-exam-prep.vercel.app';
const APP_NAME = 'MedCertExamPrep';

/**
 * @description Generate study plan using OpenRouter API
 * @param {SurveyFormData} surveyData - User survey data
 * @returns {Promise<any>} - AI generated study plan
 */
export async function generateStudyPlan(surveyData: SurveyFormData): Promise<any> {
  try {
    console.log('Starting study plan generation...');
    
    // Calculate days until exam
    const examDate = new Date(surveyData.examDate);
    const today = new Date();
    const daysUntilExam = Math.max(1, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    console.log(`Days until exam: ${daysUntilExam}`);
    
    // Map Chinese terms to English
    const professionInEnglish = mapProfessionToEnglish(surveyData.profession);
    const currentTitleInEnglish = mapTitleToEnglish(surveyData.currentTitle);
    const targetTitleInEnglish = mapTitleToEnglish(surveyData.targetTitle);
    const studyTimeInEnglish = mapStudyTimeToEnglish(surveyData.studyTimePerDay);
    
    // Build prompt in English only
    const prompt = `You are a professional examination preparation expert for medical and healthcare professionals. Please create a detailed study plan based on the following user information:

User Information:
- Professional Category: ${professionInEnglish}
- Current Title: ${currentTitleInEnglish}
- Target Title: ${targetTitleInEnglish}
- Daily Available Study Time: ${studyTimeInEnglish}
- Days Until Exam: ${daysUntilExam}

Please return a JSON object with the following structure:
1. Overview (overview): A brief description of the overall study plan and recommendations
2. Study Modules (modules): An array containing 5-10 study modules, each with:
   - Title (title)
   - Description (description)
   - Importance (importance): Score from 1-10
   - Difficulty (difficulty): Score from 1-10
   - Duration in Days (durationDays)
   - Order (order)
3. Daily Tasks for each module (tasks): Each module contains multiple daily tasks, each with:
   - Module Index (moduleIndex)
   - Day Number (day)
   - Title (title)
   - Description (description)
   - Learning Content (learningContent)
   - Estimated Completion Time (estimatedMinutes): in minutes

The study plan should be tailored to the user's professional category, target title, and available study time. The total number of days should not exceed the days until the exam.
Please ensure the returned JSON format is correct for easy parsing by the system. Do not include any explanation or description before or after the JSON structure.`;

    // Prepare API request data - ENGLISH ONLY
    const requestData = {
      model: 'anthropic/claude-3-opus:beta',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    };
    
    // Convert to JSON string
    const requestBody = JSON.stringify(requestData);
    console.log('Preparing to send request to OpenRouter API...');
    
    // Using native fetch with ASCII-safe headers
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': APP_URL,
        'X-Title': APP_NAME,
      },
      body: requestBody,
    });
    
    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: 'Could not parse error response' };
      }
      console.error('Parsed error:', errorData);
      throw new Error(`OpenRouter API call failed: ${response.statusText}`);
    }
    
    console.log('OpenRouter API response successful, parsing results...');
    console.log('大模型返回结果Response:', response);
    const responseText = await response.text();
    console.log('Response length:', responseText.length);
    
    // For debugging purposes, log a small part of the response
    console.log('Response preview:', responseText.substring(0, 500) + '...');
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('大模型返回的结果并解析为JSON格式 Parsed data:', data);
    } catch (e) {
      console.error('Failed to parse API response JSON:', e);
      console.error('Raw response length:', responseText.length);
      throw new Error('Failed to parse API response');
    }
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('OpenRouter API returned incorrect data format:', data);
      throw new Error('OpenRouter API returned incorrect data format');
    }
    
    // Extract the content from the response
    const contentText = data.choices[0].message.content;
    console.log('Content text length:', contentText.length);
    console.log('Content preview:', contentText.substring(0, 500) + '...');
    
    try {
      // Try to parse the content directly
      return tryParseJSON(contentText);
    } catch (parseError) {
      console.error('Failed to parse returned content:', parseError);
      
      // Manual implementation: Create a default study plan structure
      return createFallbackStudyPlan(professionInEnglish, targetTitleInEnglish, daysUntilExam);
    }
  } catch (error) {
    console.error('Study plan generation failed:', error);
    throw error;
  }
}

/**
 * @description Map profession to English
 */
function mapProfessionToEnglish(profession: string): string {
  const map: Record<string, string> = {
    'medical': 'Medical',
    'nursing': 'Nursing',
    'pharmacy': 'Pharmacy and Technology'
  };
  return map[profession] || 'Unknown Profession';
}

/**
 * @description Map title to English
 */
function mapTitleToEnglish(title: string): string {
  const map: Record<string, string> = {
    'none': 'No Title',
    'junior': 'Junior Level',
    'mid': 'Mid Level',
    'associate': 'Associate Senior Level',
    'senior': 'Senior Level'
  };
  return map[title] || 'Unknown Title';
}

/**
 * @description Map study time to English
 */
function mapStudyTimeToEnglish(studyTime: string): string {
  const map: Record<string, string> = {
    '<1': 'Less than 1 hour',
    '1-2': '1-2 hours',
    '2-4': '2-4 hours',
    '4+': 'More than 4 hours'
  };
  return map[studyTime] || 'Unknown Study Time';
}

/**
 * Try to parse JSON with better error handling
 * @param text JSON string to parse
 */
function tryParseJSON(text: string): any {
  try {
    // First, try direct parsing
    return JSON.parse(text);
  } catch (e) {
    console.log('Initial parse failed, trying to clean the string...');
    
    // Sometimes LLMs add extra text before or after the JSON
    // Try to find JSON structure by looking for { and } pairs
    let startIdx = text.indexOf('{');
    let endIdx = text.lastIndexOf('}');
    
    if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
      let jsonText = text.substring(startIdx, endIdx + 1);
      try {
        return JSON.parse(jsonText);
      } catch (e2) {
        console.error('Second parse attempt failed');
      }
    }
    
    // If still fails, try a more aggressive approach
    // Looking for "overview" property
    const overviewMatch = text.match(/"overview"\s*:\s*"[^"]*"/);
    if (overviewMatch && overviewMatch.index !== undefined) {
      // Find the entire JSON object
      let bracketCount = 0;
      let foundStart = false;
      let start = 0;
      let end = text.length - 1;
      
      // Search backward from overview to find opening bracket
      for (let i = overviewMatch.index; i >= 0; i--) {
        if (text[i] === '{') {
          foundStart = true;
          start = i;
          break;
        }
      }
      
      // Search forward to find proper closing bracket
      if (foundStart) {
        for (let i = start; i < text.length; i++) {
          if (text[i] === '{') bracketCount++;
          if (text[i] === '}') bracketCount--;
          if (bracketCount === 0) {
            end = i;
            break;
          }
        }
        
        if (bracketCount === 0) {
          try {
            return JSON.parse(text.substring(start, end + 1));
          } catch (e3) {
            console.error('Third parse attempt failed');
          }
        }
      }
    }
    
    // All parsing attempts failed
    throw new Error('Failed to parse content: ' + e);
  }
}

/**
 * Create a fallback study plan when parsing fails
 */
function createFallbackStudyPlan(profession: string, targetTitle: string, daysUntilExam: number): any {
  console.log('Creating fallback study plan');
  
  // Create a basic plan with fewer modules/tasks
  const daysPerModule = Math.max(3, Math.min(7, Math.floor(daysUntilExam / 5)));
  const numModules = Math.min(5, Math.floor(daysUntilExam / daysPerModule));
  
  const modules = [];
  const tasks = [];
  
  // Common module topics based on profession
  const moduleTopics = getProfessionModules(profession);
  
  // Create modules
  for (let i = 0; i < numModules; i++) {
    const topic = moduleTopics[i % moduleTopics.length];
    modules.push({
      title: topic.title,
      description: topic.description,
      importance: 8,
      difficulty: 7,
      durationDays: daysPerModule,
      order: i + 1
    });
    
    // Add 2-3 tasks per module
    const tasksPerModule = Math.min(3, daysPerModule);
    for (let j = 0; j < tasksPerModule; j++) {
      tasks.push({
        moduleIndex: i,
        day: i * daysPerModule + j + 1,
        title: `${topic.title} - Day ${j+1}`,
        description: `Study ${topic.title} fundamentals and key concepts.`,
        learningContent: `Read relevant chapters, complete practice questions on ${topic.title}.`,
        estimatedMinutes: 120
      });
    }
  }
  
  return {
    overview: `This is a ${daysUntilExam}-day study plan for ${profession} professionals preparing for ${targetTitle} certification. Focus on key modules and daily tasks.`,
    modules,
    tasks
  };
}

/**
 * Get module topics based on profession
 */
function getProfessionModules(profession: string): Array<{title: string, description: string}> {
  if (profession.toLowerCase().includes('nursing')) {
    return [
      { title: 'Fundamentals of Nursing', description: 'Core nursing concepts and patient care.' },
      { title: 'Nursing Assessment', description: 'Comprehensive patient assessment techniques.' },
      { title: 'Pharmacology', description: 'Medication administration and drug knowledge.' },
      { title: 'Medical-Surgical Nursing', description: 'Care for patients with various medical conditions.' },
      { title: 'Specialty Areas', description: 'Pediatrics, obstetrics, and psychiatric nursing.' }
    ];
  } else if (profession.toLowerCase().includes('medical')) {
    return [
      { title: 'Clinical Diagnosis', description: 'Diagnostic procedures and assessments.' },
      { title: 'Pharmacotherapy', description: 'Therapeutic medication management.' },
      { title: 'Internal Medicine', description: 'Common medical conditions and treatment.' },
      { title: 'Specialty Areas', description: 'Cardiology, neurology, and other specialties.' },
      { title: 'Patient Management', description: 'Comprehensive care planning and execution.' }
    ];
  } else {
    return [
      { title: 'Pharmaceuticals', description: 'Drug classifications and applications.' },
      { title: 'Pharmacy Practice', description: 'Dispensing procedures and regulations.' },
      { title: 'Clinical Pharmacy', description: 'Patient-centered pharmaceutical care.' },
      { title: 'Pharmaceutical Calculations', description: 'Dosage calculations and formulations.' },
      { title: 'Pharmacy Laws', description: 'Legal and ethical aspects of pharmacy practice.' }
    ];
  }
} 