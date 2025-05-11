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
import { ArrowLeft, Book, BookOpen, Clock, CheckCircle, Lightbulb, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/use-auth-store';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// 每页显示的知识点数量
const ITEMS_PER_PAGE = 3;

interface Task {
  title: string;
  description: string;
  duration: number;
  resources: string[];
  isCompleted: boolean;
  subject?: string; // 添加关联的科目
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

// 判断科目是否为专业实践能力相关
function isPracticalSubject(subject: string): boolean {
  return subject.includes('专业实践能力') || 
         subject.includes('实践能力') || 
         subject.includes('操作技能') ||
         subject.includes('实践技能') ||
         subject.includes('基础护理');
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
  const [practicalTasks, setPracticalTasks] = useState<Task[]>([]);
  const [otherTasks, setOtherTasks] = useState<Task[]>([]);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  
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
        
        // 分类任务为专业实践能力相关和其他
        categorizeTasks(matchingPlan);
        
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
  
  // 分类任务为专业实践能力相关和其他
  const categorizeTasks = (plan: DailyPlan) => {
    // 基于科目或任务标题/描述判断
    const practicalSubjects = plan.subjects.filter(isPracticalSubject);
    
    // 将任务分为专业实践能力相关和其他
    const practical: Task[] = [];
    const others: Task[] = [];
    
    plan.tasks.forEach(task => {
      // 增强版判断: 任务是否与专业实践能力相关
      const isPractical = 
        // 如果任务本身有科目标记并且是专业实践能力
        (task.subject && isPracticalSubject(task.subject)) ||
        // 或者任务标题/描述中包含相关关键词
        task.title.includes('实践') || 
        task.title.includes('操作') || 
        task.title.includes('技能') ||
        task.title.includes('护理') ||
        task.description.includes('实践能力') ||
        task.description.includes('操作技能') ||
        // 或者任务的资源名称包含相关关键词
        task.resources.some(r => 
          r.includes('实践') || 
          r.includes('操作') || 
          r.includes('技能') || 
          r.includes('基础护理')
        ) ||
        // 如果有专业实践能力科目，且计划中只有一个科目，则所有任务都视为相关
        (practicalSubjects.length > 0 && plan.subjects.length === 1);
      
      if (isPractical) {
        practical.push(task);
      } else {
        others.push(task);
      }
    });
    
    setPracticalTasks(practical);
    setOtherTasks(others);
  };
  
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
    
    // 更新任务分类
    categorizeTasks(updatedPlan);
    
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
  
  // 分页逻辑
  const totalPages = Math.ceil(knowledgePoints.length / ITEMS_PER_PAGE);
  const currentPageItems = knowledgePoints.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // 切换卡片展开/折叠状态
  const toggleCardExpand = (cardId: number) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
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
  
  // 获取专业实践能力科目
  const practicalSubjects = dailyPlan.subjects.filter(isPracticalSubject);
  
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
            <span 
              key={idx} 
              className={`inline-block px-2 py-1 rounded text-sm ${
                isPracticalSubject(subject) 
                  ? 'bg-blue-100 text-blue-700 font-medium' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {subject}{isPracticalSubject(subject) && ' ★'}
            </span>
          ))}
        </div>
        {practicalSubjects.length > 0 && (
          <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-100">
            <div className="flex items-center text-sm text-blue-700">
              <Star className="h-4 w-4 mr-1" />
              <span>重点关注专业实践能力科目</span>
            </div>
          </div>
        )}
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
              {/* 知识点分页提示 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 text-sm">
                  <span className="text-gray-500">显示 {currentPageItems.length} 个知识点（共 {knowledgePoints.length} 个）</span>
                  <div className="text-gray-700">
                    第 {currentPage}/{totalPages} 页
                  </div>
                </div>
              )}
              
              {/* 知识点卡片列表 */}
              {currentPageItems.map((kp) => (
                <Collapsible 
                  key={kp.id}
                  open={expandedCards[kp.id] || false}
                  onOpenChange={() => toggleCardExpand(kp.id)}
                  className="border rounded-lg overflow-hidden shadow-sm"
                >
                  <div className="bg-gray-50 border-b p-4">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex justify-between items-start">
                        <div className="text-left">
                          <h3 className="text-lg font-semibold">{kp.title}</h3>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            <span 
                              className={`px-1.5 py-0.5 rounded ${
                                isPracticalSubject(kp.subjectName) 
                                  ? 'bg-blue-100 text-blue-600' 
                                  : 'bg-gray-100'
                              }`}
                            >
                              {kp.subjectName}
                            </span>
                            <span>•</span>
                            <span>{kp.chapterName}</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 font-medium mr-2">
                            <span className="text-xs text-primary">重要度: {kp.importance}</span>
                          </div>
                          <div className="text-gray-400 transform transition-transform duration-200 ease-in-out">
                            {expandedCards[kp.id] ? (
                              <ChevronRight className="h-5 w-5 rotate-90" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                  </div>
                  
                  <CollapsibleContent>
                    <div className="p-5 bg-white">
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
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
              
              {/* 分页控制 */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-4 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={goToPrevPage} 
                    disabled={currentPage === 1}
                    className="flex items-center"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> 上一页
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={goToNextPage} 
                    disabled={currentPage === totalPages}
                    className="flex items-center"
                  >
                    下一页 <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <Book className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-800 mb-1">暂无相关知识点</h3>
              <p className="text-gray-500">请完成学习任务获取今日的学习内容</p>
            </div>
          )}
          
          {/* 学习任务 - 专业实践能力科目 */}
          {practicalTasks.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center text-blue-700">
                <Star className="h-4 w-4 mr-2" />
                专业实践能力学习任务
              </h2>
              <div className="space-y-4">
                {practicalTasks.map((task, index) => {
                  const taskIndex = dailyPlan.tasks.findIndex(t => 
                    t.title === task.title && t.description === task.description
                  );
                  return (
                    <Card key={index} className={`border ${task.isCompleted ? 'bg-blue-50' : 'border-blue-100'}`}>
                      <CardHeader className="py-3 px-4">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base font-medium">{task.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-600 whitespace-nowrap">
                              <Clock className="h-3 w-3 inline mr-1" /> {task.duration}分钟
                            </span>
                            <Button
                              variant="ghost"
                              size="icon" 
                              className={`h-8 w-8 ${task.isCompleted ? 'text-green-600' : 'text-gray-400'}`}
                              onClick={() => handleTaskComplete(taskIndex)}
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
                  );
                })}
              </div>
            </div>
          )}
          
          {/* 其他学习任务 */}
          {otherTasks.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">其他学习任务</h2>
              <div className="space-y-4">
                {otherTasks.map((task, index) => {
                  const taskIndex = dailyPlan.tasks.findIndex(t => 
                    t.title === task.title && t.description === task.description
                  );
                  return (
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
                              onClick={() => handleTaskComplete(taskIndex)}
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
                                  <BookOpen className="h-3 w-3 text-gray-500" />
                                  <span>{resource}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* 如果任务都归类到其中一类了，但原始任务列表不为空，显示原始列表 */}
          {practicalTasks.length === 0 && otherTasks.length === 0 && dailyPlan.tasks.length > 0 && (
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
                                <BookOpen className="h-3 w-3 text-gray-500" />
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
          )}
          
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