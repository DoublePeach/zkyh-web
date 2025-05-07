'use client';

/**
 * @description 每日学习任务详情页面 - 显示特定日期的学习内容和测验
 * @author 郝桃桃
 * @date 2024-08-22
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Book, BookOpen, Clock, CheckCircle, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/use-auth-store';

interface Task {
  title: string;
  description: string;
  duration: number;
  resources: string[];
  isCompleted: boolean;
}

interface DailyPlan {
  day: number;
  date: string;
  phaseId: number;
  title: string;
  subjects: string[];
  tasks: Task[];
  reviewTips?: string;
  dateObj?: Date;
}

interface KnowledgePoint {
  id: number;
  title: string;
  content: string;
  subjectId: number;
  subjectName: string;
  chapterId: number;
  chapterName: string;
  difficulty: number;
  importance: number;
  keywords: string[] | null;
}

function getCachedPlanData(planId: string): { plan: any; phases: any[]; dailyPlans: DailyPlan[] } | null {
  if (typeof window === 'undefined') return null;
  try {
    const cacheKey = `plan_${planId}`;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    const now = new Date().getTime();
    if (now - timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    return data;
  } catch (error) {
    console.error('读取缓存数据失败:', error);
    return null;
  }
}

function cachePlanData(planId: string, data: { plan: any; phases: any[]; dailyPlans: DailyPlan[] }): void {
  if (typeof window === 'undefined') return;
  try {
    const cacheKey = `plan_${planId}`;
    const cacheData = { data, timestamp: new Date().getTime() };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('缓存数据失败:', error);
  }
}

export default function DailyLearningPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [activeTab, setActiveTab] = useState('content');
  const [dayFormatted, setDayFormatted] = useState('');
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    const loadDailyPlan = async () => {
      setLoading(true);
      try {
        // 获取参数
        const planId = String(params?.id);
        const phaseId = String(params?.phaseId);
        const day = String(params?.day);
        
        if (!planId || !day) {
          toast.error('缺少必要参数');
          return;
        }
        
        // 从缓存加载计划数据
        const cachedData = getCachedPlanData(planId);
        if (!cachedData) {
          toast.error('未找到备考规划数据');
          return;
        }
        
        // 查找匹配的每日计划
        const matchingPlan = cachedData.dailyPlans.find(plan => plan.day.toString() === day);
        if (!matchingPlan) {
          toast.error('未找到当日学习计划');
          return;
        }
        
        // 设置状态
        setDailyPlan(matchingPlan);
        
        // 格式化日期
        const dateObj = new Date(matchingPlan.date);
        setDayFormatted(`${dateObj.getMonth() + 1}月${dateObj.getDate()}日`);
        
        // 获取知识点信息
        fetchKnowledgePoints(planId, matchingPlan);
      } catch (error) {
        console.error('加载每日学习计划失败:', error);
        toast.error('加载学习内容失败');
      } finally {
        setLoading(false);
      }
    };
    
    loadDailyPlan();
  }, [isAuthenticated, params, router]);
  
  const fetchKnowledgePoints = async (planId: string, dailyPlan: DailyPlan) => {
    if (!dailyPlan.subjects.length) return;
    
    setContentLoading(true);
    try {
      const subjects = dailyPlan.subjects.join(',');
      const response = await fetch(
        `/api/study-plans/day-tasks?planId=${planId}&date=${dailyPlan.date}&subjects=${subjects}`
      );
      
      if (!response.ok) {
        throw new Error('获取相关知识点失败');
      }
      
      const data = await response.json();
      
      if (data.success && data.data.knowledgePoints) {
        // 按重要性排序，重要的在前面
        const sortedPoints = [...data.data.knowledgePoints].sort((a, b) => b.importance - a.importance);
        setKnowledgePoints(sortedPoints);
      }
    } catch (error) {
      console.error('获取知识点失败:', error);
      toast.error('无法加载相关知识点');
    } finally {
      setContentLoading(false);
    }
  };
  
  const handleTaskComplete = (taskIndex: number) => {
    if (!dailyPlan || !params?.id) return;
    
    const updatedTasks = [...dailyPlan.tasks];
    if (updatedTasks[taskIndex]) {
      updatedTasks[taskIndex].isCompleted = !updatedTasks[taskIndex].isCompleted;
      toast.success(updatedTasks[taskIndex].isCompleted ? '任务已完成' : '已取消完成状态');
    }
    
    const updatedPlan = { ...dailyPlan, tasks: updatedTasks };
    setDailyPlan(updatedPlan);
    
    // 更新缓存
    const cachedData = getCachedPlanData(String(params.id));
    if (cachedData) {
      const updatedPlans = cachedData.dailyPlans.map(plan => 
        plan.day === dailyPlan.day ? updatedPlan : plan
      );
      cachePlanData(String(params.id), {
        ...cachedData,
        dailyPlans: updatedPlans
      });
    }
  };
  
  const handleGoBack = () => {
    router.back();
  };
  
  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent animate-spin rounded-full"></div>
          <p className="text-lg">加载学习内容中...</p>
        </div>
      </div>
    );
  }
  
  if (!dailyPlan) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="text-2xl font-bold mb-4">未找到学习内容</h1>
          <p className="text-gray-500 mb-6">找不到当日的学习计划内容</p>
          <Button onClick={handleGoBack}>返回</Button>
        </div>
      </div>
    );
  }
  
  const completedTaskCount = dailyPlan.tasks.filter(task => task.isCompleted).length;
  const totalTasks = dailyPlan.tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTaskCount / totalTasks) * 100) : 0;
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* 页面头部 */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={handleGoBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{dayFormatted} · {dailyPlan.title}</h1>
          <div className="flex items-center mt-2">
            <span className="text-sm text-muted-foreground mr-2">学习进度: {progress}% ({completedTaskCount}/{totalTasks})</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 学习主题 */}
      <div className="mb-6">
        <div className="text-sm font-medium mb-2">今日学习主题:</div>
        <div className="flex flex-wrap gap-2">
          {dailyPlan.subjects.map((subject, idx) => (
            <span key={idx} className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
              {subject}
            </span>
          ))}
        </div>
      </div>
      
      {/* 选项卡内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="content">
            <div className="flex items-center gap-2">
              <Book className="h-4 w-4" />
              <span>学习内容</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="quiz">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>学习测验</span>
            </div>
          </TabsTrigger>
        </TabsList>
        
        {/* 学习内容选项卡 */}
        <TabsContent value="content" className="space-y-6">
          {/* 知识点内容 */}
          {contentLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent animate-spin rounded-full"></div>
              <span className="ml-3 text-gray-500">加载知识点内容...</span>
            </div>
          ) : knowledgePoints.length > 0 ? (
            <div className="space-y-6">
              {knowledgePoints.map((kp) => (
                <Card key={kp.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 border-b pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-semibold">{kp.title}</CardTitle>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                          <span>{kp.subjectName}</span>
                          <span>•</span>
                          <span>{kp.chapterName}</span>
                        </div>
                      </div>
                      <div className="flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 font-medium">
                        <span className="text-xs text-primary">重要度: {kp.importance}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-700">
                      <div className="whitespace-pre-line">{kp.content}</div>
                    </div>
                    
                    {kp.keywords && kp.keywords.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-700 mb-2">关键词:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {kp.keywords.map((keyword, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <Book className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-800 mb-1">暂无相关知识点</h3>
              <p className="text-gray-500">请完成学习任务获取今日的学习内容</p>
            </div>
          )}
          
          {/* 学习任务 */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">今日学习任务</h2>
            <div className="space-y-4">
              {dailyPlan.tasks.map((task, index) => (
                <Card key={index} className={`border ${task.isCompleted ? 'bg-gray-50' : ''}`}>
                  <CardHeader className="py-3 px-4">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base font-medium">{task.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 whitespace-nowrap">
                          <Clock className="h-3 w-3 inline mr-1" /> {task.duration}分钟
                        </span>
                        <Button
                          variant="ghost"
                          size="icon" 
                          className={`h-8 w-8 ${task.isCompleted ? 'text-green-600' : 'text-gray-400'}`}
                          onClick={() => handleTaskComplete(index)}
                        >
                          <CheckCircle className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                    {task.resources && task.resources.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-xs font-medium mb-1 text-gray-500">学习资源:</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {task.resources.map((resource, idx) => (
                            <li key={idx} className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3 text-blue-500" />
                              <span>{resource}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          {/* 复习建议 */}
          {dailyPlan.reviewTips && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-md">
              <h3 className="text-sm font-medium flex items-center gap-1 text-amber-800 mb-2">
                <Lightbulb className="h-4 w-4" />
                <span>复习建议</span>
              </h3>
              <p className="text-sm text-amber-700">{dailyPlan.reviewTips}</p>
            </div>
          )}
        </TabsContent>
        
        {/* 学习测验选项卡 */}
        <TabsContent value="quiz">
          <div className="bg-gray-50 p-8 rounded-lg text-center border">
            <h3 className="text-lg font-medium mb-4">学习测验功能开发中</h3>
            <p className="text-gray-500 mb-6">该功能即将上线，敬请期待！</p>
            <Button variant="outline" onClick={() => setActiveTab('content')}>
              返回学习内容
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 