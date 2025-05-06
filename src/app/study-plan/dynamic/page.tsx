'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { CalendarDays, BookOpen, Star, CheckCircle2, Loader2 } from 'lucide-react';
import { SurveyFormData } from '@/types/survey';

// 基础表单数据
const defaultFormData: SurveyFormData = {
  titleLevel: 'junior', // 初级护师
  otherTitleLevel: '',
  examStatus: 'first', // 首次参加考试
  examYear: '2025', // 考试年份
  subjects: {
    basic: true,
    related: true,
    professional: true,
    practical: true
  },
  overallLevel: 'medium', // 有一定基础
  subjectLevels: {
    basic: 'medium',
    related: 'medium',
    professional: 'low',
    practical: 'medium'
  },
  weekdaysCount: '3-4', // 每周3-4天
  weekdayHours: '1-2', // 工作日1-2小时
  weekendHours: '2-4' // 周末2-4小时
};

export default function DynamicStudyPlanPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    tables: string[];
    examSubjectsCount: number;
    stats?: Record<string, number>;
  }>({
    connected: false,
    tables: [],
    examSubjectsCount: 0
  });
  
  const [studyPlan, setStudyPlan] = useState<any>(null);
  
  // 连接到数据库并检查状态
  const checkDatabaseConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 调用API获取数据库状态
      const response = await fetch('/api/study-plan/dynamic');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '无法连接到数据库');
      }
      
      const data = await response.json();
      
      setDbStatus({
        connected: data.connected,
        tables: data.tables || [],
        examSubjectsCount: data.examSubjectsCount || 0,
        stats: data.stats || {}
      });
      
      setLoading(false);
    } catch (err) {
      console.error('数据库连接检查失败:', err);
      setError('无法连接到数据库，请检查连接配置');
      setLoading(false);
    }
  };
  
  // 生成备考规划
  const generateStudyPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 调用API生成备考规划
      const response = await fetch('/api/study-plan/dynamic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ formData: defaultFormData }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '生成备考规划失败');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.plan) {
        throw new Error('返回的数据格式不正确');
      }
      
      setStudyPlan(data.plan);
      setLoading(false);
    } catch (err) {
      console.error('生成备考规划失败:', err);
      setError('无法生成备考规划，请稍后再试');
      setLoading(false);
    }
  };
  
  // 初始化时检查数据库连接
  useEffect(() => {
    checkDatabaseConnection();
  }, []);
  
  // 渲染备考规划
  const renderStudyPlan = () => {
    if (!studyPlan) return null;
    
    // 计算考试日期
    const examYear = parseInt(defaultFormData.examYear);
    const examDate = new Date(examYear, 3, 13); // 月份从0开始，所以4月是3
    const today = new Date();
    const totalDays = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return (
      <div className="space-y-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {defaultFormData.titleLevel === 'junior' ? '初级护师' : 
               defaultFormData.titleLevel === 'mid' ? '主管护师' : 
               defaultFormData.otherTitleLevel}备考规划
            </CardTitle>
            <CardDescription>{studyPlan.overview}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span className="font-medium">总学习天数</span>
                </div>
                <p className="text-2xl font-bold">{totalDays}天</p>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="font-medium">学习进度</span>
                </div>
                <div className="space-y-2">
                  <Progress value={0} />
                  <p className="text-sm text-gray-500">0% 完成</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="font-medium">学习时间</span>
                </div>
                <p className="text-sm">
                  {today.toLocaleDateString()} 至 {examDate.toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <h2 className="text-xl font-bold mb-4">学习阶段</h2>
        
        <div className="space-y-4">
          {studyPlan.phases.map((phase: any) => (
            <Card key={phase.id}>
              <CardHeader>
                <CardTitle className="text-lg">{phase.name}</CardTitle>
                <CardDescription>{phase.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm">
                      <span className="font-medium">学习天数：</span>
                      {phase.endDay - phase.startDay + 1}天（第{phase.startDay}天至第{phase.endDay}天）
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">重点领域：</span>
                      {phase.focusAreas.join('、')}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">学习目标：</span>
                    </p>
                    <ul className="list-disc pl-5 text-sm">
                      {phase.learningGoals.map((goal: string, idx: number) => (
                        <li key={idx}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <h3 className="font-medium mb-2 text-sm">推荐资源：</h3>
                <ul className="space-y-2">
                  {phase.recommendedResources.map((resource: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-gray-300" />
                      <span>{resource}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <h2 className="text-xl font-bold mb-4 mt-8">每日学习计划示例</h2>
        
        <div className="space-y-4">
          {studyPlan.dailyPlans.slice(0, 5).map((day: any) => (
            <Card key={day.day}>
              <CardHeader>
                <CardTitle className="text-lg">第{day.day}天：{day.title}</CardTitle>
                <CardDescription>
                  {day.date} | 学习阶段：{studyPlan.phases.find((p: any) => p.id === day.phaseId)?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2 text-sm">学习科目：</h3>
                    <p className="text-sm">{day.subjects.join('、')}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2 text-sm">今日任务：</h3>
                    <ul className="space-y-3">
                      {day.tasks.map((task: any, idx: number) => (
                        <li key={idx} className="border rounded p-3">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-sm">{task.title}</h4>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{task.duration}分钟</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                          {task.resources.length > 0 && (
                            <div className="text-xs text-gray-500">
                              <p className="font-medium">资源：</p>
                              <ul className="list-disc pl-5">
                                {task.resources.map((res: string, idx: number) => (
                                  <li key={idx}>{res}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1 text-sm">复习建议：</h3>
                    <p className="text-sm text-gray-600">{day.reviewTips}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {studyPlan.dailyPlans.length > 5 && (
            <div className="text-center py-4 text-sm text-gray-500">
              显示前5天内容，共{studyPlan.dailyPlans.length}天
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">动态备考规划</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={checkDatabaseConnection} 
              disabled={loading}
            >
              检查数据库
            </Button>
            <Button 
              onClick={generateStudyPlan} 
              disabled={loading || !dbStatus.connected}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  处理中...
                </>
              ) : '生成备考规划'}
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {dbStatus.connected && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>数据库连接状态</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-600 mb-2">✓ 数据库连接成功</p>
              <p className="text-sm">可用表: {dbStatus.tables.slice(0, 5).join(', ')}{dbStatus.tables.length > 5 ? `... 等${dbStatus.tables.length}个表` : ''}</p>
              <p className="text-sm">考试学科数量: {dbStatus.examSubjectsCount}</p>
              {dbStatus.stats && (
                <div className="mt-2">
                  <p className="text-sm font-medium">数据统计:</p>
                  <ul className="text-sm">
                    {Object.entries(dbStatus.stats).map(([key, value]) => (
                      <li key={key}>{key.replace('_count', '')}: {value}条记录</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">正在处理，请稍候...</span>
          </div>
        )}
        
        {!loading && studyPlan && renderStudyPlan()}
        
        {!loading && !studyPlan && dbStatus.connected && (
          <div className="text-center py-20 text-gray-500">
            <p className="mb-4">点击"生成备考规划"按钮，根据数据库中的实际学习资料生成个性化备考计划。</p>
            <p className="text-sm">备考规划将基于以下信息生成：</p>
            <ul className="text-sm list-disc inline-block text-left mt-2">
              <li>学习者类型：{defaultFormData.titleLevel === 'junior' ? '初级护师' : '主管护师'}</li>
              <li>考试年份：{defaultFormData.examYear}年</li>
              <li>学习基础：{defaultFormData.overallLevel === 'medium' ? '有一定基础' : defaultFormData.overallLevel === 'weak' ? '基础薄弱' : '基础扎实'}</li>
              <li>学习时间：每周{defaultFormData.weekdaysCount}个工作日，工作日{defaultFormData.weekdayHours}小时/天，周末{defaultFormData.weekendHours}小时/天</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 