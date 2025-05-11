'use client';

/**
 * @description 备考规划阶段详情视图组件 - 用于展示特定阶段的每周学习任务
 * @author 郝桃桃
 * @date 2024-06-20 (Refactored to weekly view 2024-08-07)
 * @features
 * - 展示特定阶段的每周学习任务概览
 * - 支持按周选择，显示该周7天的学习安排
 * - 点击有计划的日期可进一步查看每日任务 (TODO)
 * - 点击无计划的日期会提示用户休息
 */

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/use-auth-store';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// 定义类型
interface Plan {
  id: number;
  title: string;
  totalDays: number;
  startDate: string | Date;
  endDate: string | Date;
  overview?: string;
  planData?: Record<string, unknown>;
}

interface Phase {
  id: number;
  name: string;
  description: string;
  startDay: number;
  endDay: number;
  focusAreas: string[];
  learningGoals: string[];
  recommendedResources: string[];
}

interface Task {
  title: string;
  description: string;
  duration: number;
  resources: string[];
  isCompleted: boolean;
}

interface DailyPlan {
  day: number; // Original day number in the overall plan
  date: string; // YYYY-MM-DD
  phaseId: number;
  title: string;
  subjects: string[];
  tasks: Task[];
  reviewTips?: string;
  dateObj?: Date; // Added for easier date operations after fetching
}

// Helper functions for date manipulation
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatShortDate(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

const CHINESE_DAYS_OF_WEEK = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

interface WeeklyPlanGroup {
  weekNumberInPhase: number;
  weekLabel: string; 
  startDateOfWeek: Date;
  endDateOfWeek: Date;
  dailyPlansInWeek: DailyPlan[]; // These will have dateObj
  weeklySubjectsOverview: string;
}

interface DayDisplayInfo {
  date: Date;
  dayLabel: string; 
  plan: DailyPlan | null; // DailyPlan here will have dateObj
  isPlaceholder: boolean; 
}

function getCachedPlanData(planId: string): { plan: Plan; phases: Phase[]; dailyPlans: DailyPlan[] } | null {
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

function cachePlanData(planId: string, data: { plan: Plan; phases: Phase[]; dailyPlans: DailyPlan[] }): void {
  if (typeof window === 'undefined') return;
  try {
    const cacheKey = `plan_${planId}`;
    const cacheData = { data, timestamp: new Date().getTime() };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('缓存数据失败:', error);
  }
}

// Add a new function to identify and highlight Professional Practice ability subject
/**
 * @description 确定科目是否为专业实践能力
 * @param {string} subject - 科目名称
 * @returns {boolean} 是否为专业实践能力科目
 */
function isPracticalSubject(subject: string): boolean {
  return subject.includes('专业实践能力') || 
         subject.includes('实践能力') || 
         subject.includes('操作技能') ||
         subject.includes('实践技能');
}

// Add a new component to render subjects with highlighting
function SubjectBadge({ subject }: { subject: string }) {
  const isPractical = isPracticalSubject(subject);
  return (
    <span className={`px-2 py-1 text-xs rounded-md ${
      isPractical 
        ? 'bg-blue-100 text-blue-700 font-medium' 
        : 'bg-gray-100 text-gray-600'
    }`}>
      {subject}{isPractical && ' ★'}
    </span>
  );
}

// 带Suspense的路由参数组件
function RouteParamsProvider({ 
  children 
}: { 
  children: (params: { id?: string, phaseId?: string }) => React.ReactNode 
}) {
  const params = useParams();
  return <>{children({ id: params?.id as string, phaseId: params?.phaseId as string })}</>;
}

// 带Suspense的路由导航组件
function RouterProvider({
  children
}: {
  children: (router: ReturnType<typeof useRouter>) => React.ReactNode
}) {
  const router = useRouter();
  return <>{children(router)}</>;
}

// 主组件
function PhaseDetailViewContent({ 
  planId, 
  phaseIdString,
  router
}: { 
  planId: string, 
  phaseIdString: string,
  router: ReturnType<typeof useRouter>
}) {
  const { isAuthenticated } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [rawDailyPlans, setRawDailyPlans] = useState<DailyPlan[]>([]); // Renamed to avoid confusion
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);
  
  const [groupedWeeklyPlans, setGroupedWeeklyPlans] = useState<WeeklyPlanGroup[]>([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | null>(null);
  const [showNoPlanModal, setShowNoPlanModal] = useState(false);
  const [noPlanModalDate, setNoPlanModalDate] = useState<string>("");

  // CORE FUNCTIONS DEFINED AT TOP LEVEL (after hooks)

  const getPhaseTasks = (phaseId: number): DailyPlan[] => { // Returns DailyPlan with dateObj
    if (!rawDailyPlans || !rawDailyPlans.length) return [];
    const phaseSpecificPlans = rawDailyPlans.filter(p => p.phaseId === phaseId);
    return phaseSpecificPlans
      .map(p => ({...p, dateObj: new Date(p.date) }))
      .sort((a,b) => a.dateObj!.getTime() - b.dateObj!.getTime());
  };

  const groupPhaseTasksIntoWeeks = (phaseSpecificTasks: DailyPlan[]): WeeklyPlanGroup[] => {
    // phaseSpecificTasks here are expected to have dateObj
    if (!phaseSpecificTasks.length) return [];
    const weeklyGroups: WeeklyPlanGroup[] = [];
    if (!phaseSpecificTasks[0]?.dateObj) { // Guard against missing dateObj
        console.error("Tasks missing dateObj for weekly grouping.");
        return [];
    }
    let weekNumber = 0;

    phaseSpecificTasks.forEach(task => { // task should have dateObj
      if (!task.dateObj) return; // Skip if dateObj is somehow missing
      const taskDate = task.dateObj;
      const mondayOfTaskWeek = getMonday(taskDate);

      let group = weeklyGroups.find(wg => wg.startDateOfWeek.getTime() === mondayOfTaskWeek.getTime());

      if (!group) {
        weekNumber = weeklyGroups.length + 1; // Determine week number based on current group count before adding new one
        const endOfWeek = addDays(mondayOfTaskWeek, 6);
        group = {
          weekNumberInPhase: weekNumber,
          weekLabel: `第 ${weekNumber} 周 (${formatShortDate(mondayOfTaskWeek)} - ${formatShortDate(endOfWeek)})`,
          startDateOfWeek: mondayOfTaskWeek,
          endDateOfWeek: endOfWeek,
          dailyPlansInWeek: [],
          weeklySubjectsOverview: "",
        };
        weeklyGroups.push(group);
        // Sort weeklyGroups by startDateOfWeek to ensure they are in chronological order
        weeklyGroups.sort((a,b) => a.startDateOfWeek.getTime() - b.startDateOfWeek.getTime());
        // Re-assign weekNumberInPhase and weekLabel after sorting to maintain sequential numbering
        weeklyGroups.forEach((wg, idx) => {
          wg.weekNumberInPhase = idx + 1;
          wg.weekLabel = `第 ${wg.weekNumberInPhase} 周 (${formatShortDate(wg.startDateOfWeek)} - ${formatShortDate(wg.endDateOfWeek)})`;
        });
      }
      group.dailyPlansInWeek.push(task);
    });

    weeklyGroups.forEach(group => {
      const subjects = new Set<string>();
      group.dailyPlansInWeek.forEach(dp => {
        dp.subjects.forEach(s => subjects.add(s));
      });
      group.weeklySubjectsOverview = subjects.size > 0 
        ? `本周重点学习: ${Array.from(subjects).join('、 ')} 相关内容。`
        : "本周无特定学科重点，请查看每日安排。";
    });
    
    return weeklyGroups;
  };

  const fetchPlanData = async (planId: string, phaseIdString: string): Promise<void> => {
    setLoading(true);
    try {
      const cachedData = getCachedPlanData(planId);
      let effectiveData;
      if (cachedData) {
        effectiveData = cachedData;
      } else {
        const response = await fetch(`/api/study-plans/${planId}`);
        if (!response.ok) throw new Error(`获取备考规划失败: ${response.statusText}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error || '获取备考规划失败');
        
        const plansWithInitialStatus = result.data.dailyPlans.map((day: Omit<DailyPlan, 'dateObj'>) => ({
          ...day,
          tasks: day.tasks.map((task: Task) => ({ ...task, isCompleted: false }))
        }));
        effectiveData = { ...result.data, dailyPlans: plansWithInitialStatus };
        cachePlanData(planId, effectiveData);
      }

      setRawDailyPlans(effectiveData.dailyPlans); 

      const phaseIdNum = parseInt(phaseIdString, 10);
      const phase = effectiveData.phases.find((p: Phase) => p.id === phaseIdNum);
      setCurrentPhase(phase || null); 

    } catch (error: any) {
      console.error('获取备考规划失败:', error);
      toast.error(error.message || '获取备考规划失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  
  const goBackToStudyPlan = () => {
    setTimeout(() => {
      router.push(`/study-plan/${planId}`);
    }, 10);
  };

  // EFFECT HOOKS
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (planId && phaseIdString) {
      fetchPlanData(planId, phaseIdString);
    }
  }, [planId, phaseIdString, isAuthenticated, router]); // Removed fetchPlanData from deps

  useEffect(() => {
    if (currentPhase) {
      const phaseSpecificTasks = getPhaseTasks(currentPhase.id); // getPhaseTasks now returns tasks with dateObj
      const weeks = groupPhaseTasksIntoWeeks(phaseSpecificTasks);
      setGroupedWeeklyPlans(weeks);

      if (weeks.length > 0) {
        if (selectedWeekIndex === null || selectedWeekIndex >= weeks.length || 
            (selectedWeekIndex !== null && weeks[selectedWeekIndex]?.startDateOfWeek?.getTime() !== groupedWeeklyPlans[selectedWeekIndex]?.startDateOfWeek?.getTime())) {
          setSelectedWeekIndex(0);
        }
      } else {
        setSelectedWeekIndex(null);
      }
    } else {
      setGroupedWeeklyPlans([]);
      setSelectedWeekIndex(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [currentPhase, rawDailyPlans]); // Re-group if phase or raw plans change. selectedWeekIndex is managed internally.

  // CONDITIONAL RETURNS for loading and no phase
  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent animate-spin rounded-full"></div>
          <p className="text-lg">加载备考规划中...</p>
        </div>
      </div>
    );
  }
  
  if (!currentPhase) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">学习阶段不存在</h1>
        <p className="text-gray-500 mb-6">找不到您请求的学习阶段信息。</p>
        <Button onClick={goBackToStudyPlan}>返回备考规划</Button> {/* onClick calls goBackToStudyPlan */}
      </div>
    );
  }

  // CALCULATIONS & HANDLERS for render (now currentPhase is guaranteed)
  const calculateOverallPhaseProgress = () => {
    const tasksForThisPhase = getPhaseTasks(currentPhase.id); // currentPhase is non-null
    if (!tasksForThisPhase || !tasksForThisPhase.length) return 0;
    let totalTasks = 0;
    let completedTasks = 0;
    tasksForThisPhase.forEach(day => {
      if (day.tasks && day.tasks.length) {
        totalTasks += day.tasks.length;
        completedTasks += day.tasks.filter((t: Task) => t.isCompleted).length;
      }
    });
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const handleDayClick = (dayInfo: DayDisplayInfo) => {
    if (dayInfo.plan) {
      setTimeout(() => {
        if (dayInfo.plan) {
          router.push(`/study-plan/${planId}/phase/${phaseIdString}/day/${dayInfo.plan.day}`);
        }
      }, 10);
    } else {
      setNoPlanModalDate(formatShortDate(dayInfo.date));
      setShowNoPlanModal(true);
    }
  };

  // RENDER LOGIC
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={goBackToStudyPlan}> {/* onClick calls goBackToStudyPlan */}
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentPhase.name}</h1>
            <p className="text-gray-500 mt-1">第{currentPhase.startDay}-{currentPhase.endDay}天 (阶段总览)</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right mr-2"><p className="text-sm text-gray-500">阶段完成度</p><p className="font-medium">{calculateOverallPhaseProgress()}%</p></div>
          <div className="w-24"><Progress value={calculateOverallPhaseProgress()} className="h-2.5" /></div>
        </div>
      </div>
      
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-none shadow-sm">
        <CardContent className="pt-6 pb-6"><p className="text-gray-700">{currentPhase.description}</p></CardContent>
      </Card>

      <h2 className="text-xl font-bold mb-4 text-gray-900">每周学习任务</h2>

      {groupedWeeklyPlans.length > 0 && (
        <div className="mb-6 overflow-x-auto pb-2">
          <div className="flex space-x-2">
            {groupedWeeklyPlans.map((week, index) => (
              <Button
                key={week.weekNumberInPhase}
                variant={selectedWeekIndex === index ? 'default' : 'outline'}
                onClick={() => setSelectedWeekIndex(index)}
                className="whitespace-nowrap"
              >
                {week.weekLabel}
              </Button>
            ))}
          </div>
        </div>
      )}

      {selectedWeekIndex !== null && groupedWeeklyPlans[selectedWeekIndex] ? (
        (() => {
          const currentWeekData = groupedWeeklyPlans[selectedWeekIndex];
          const daysToDisplay: DayDisplayInfo[] = [];
          const weekStartDate = new Date(currentWeekData.startDateOfWeek);

          for (let i = 0; i < 7; i++) {
            const dayDate = addDays(weekStartDate, i);
            const planForThisDate = currentWeekData.dailyPlansInWeek.find(
              p => p.dateObj && p.dateObj.toDateString() === dayDate.toDateString()
            );
            daysToDisplay.push({
              date: dayDate,
              dayLabel: `${formatShortDate(dayDate)} ${CHINESE_DAYS_OF_WEEK[dayDate.getDay()]}`,
              plan: planForThisDate || null,
              isPlaceholder: false, 
            });
          }

          return (
            <Card className="mb-6 border border-gray-100 shadow-sm">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-lg">
                  {currentWeekData.weekLabel} - 学习安排
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="mb-4">
                  <div className="text-sm text-gray-700 mb-2 flex items-center gap-2">
                    <span className="font-medium">本周学习重点:</span>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(new Set(
                        currentWeekData.dailyPlansInWeek.flatMap(dp => dp.subjects)
                      )).map((subject, idx) => (
                        <SubjectBadge key={idx} subject={subject} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 italic">
                    备注: 标记★的为专业实践能力相关内容，本备考规划将重点关注该部分
                  </p>
                </div>
                
                <div className="space-y-3">
                  {daysToDisplay.map((dayInfo) => {
                    // 检查是否包含专业实践能力科目
                    const hasPracticalSubject = dayInfo.plan?.subjects?.some(isPracticalSubject) ?? false;
                    return (
                      <div
                        key={dayInfo.date.toISOString()}
                        onClick={() => handleDayClick(dayInfo)}
                        className={`p-3 rounded-md border flex justify-between items-center transition-all hover:shadow-md ${
                          dayInfo.plan 
                            ? hasPracticalSubject
                              ? 'bg-blue-50 hover:border-primary cursor-pointer border-blue-100' 
                              : 'bg-white hover:border-primary cursor-pointer'
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100 cursor-pointer'
                        }`}
                      >
                        <div>
                          <p className={`font-medium ${dayInfo.plan ? 'text-gray-800' : 'text-gray-500'}`}>
                            {dayInfo.dayLabel}
                          </p>
                          {dayInfo.plan ? (
                            <div>
                              <p className="text-xs text-primary mt-0.5">
                                {dayInfo.plan.title} (共 {dayInfo.plan.tasks.length} 项任务)
                              </p>
                              {dayInfo.plan.subjects.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {dayInfo.plan.subjects.map((subject, idx) => (
                                    <span key={idx} className={`px-1.5 py-0.5 text-xs rounded ${
                                      isPracticalSubject(subject) 
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {subject}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 mt-0.5">无学习任务</p>
                          )}
                        </div>
                        {dayInfo.plan && <ArrowRight className="h-4 w-4 text-gray-400" />}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })()
      ) : groupedWeeklyPlans.length > 0 ? (
        <p className="text-gray-500 text-center py-8">请选择一周查看详细安排。</p>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">此阶段暂无周学习任务安排。</p>
            <Button variant="outline" className="mt-4" onClick={goBackToStudyPlan}> {/* onClick calls goBackToStudyPlan */}
              返回备考规划
            </Button>
          </CardContent>
        </Card>
      )}

      {showNoPlanModal && (
         <AlertDialog open={showNoPlanModal} onOpenChange={setShowNoPlanModal}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>休息一下</AlertDialogTitle>
                <AlertDialogDescription>
                    {noPlanModalDate} 没有学习任务，可以好好放松下啦！
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogAction onClick={() => setShowNoPlanModal(false)}>好的</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      )}
    </div>
  );
}

// 导出主要组件
export default function PhaseDetailView() {
  return (
    <Suspense fallback={
      <div className="container flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent animate-spin rounded-full"></div>
          <p className="text-lg">正在加载页面...</p>
        </div>
      </div>
    }>
      <RouterProvider>
        {(router) => (
          <RouteParamsProvider>
            {(params) => (
              <PhaseDetailViewContent 
                planId={params.id || ''} 
                phaseIdString={params.phaseId || ''}
                router={router}
              />
            )}
          </RouteParamsProvider>
        )}
      </RouterProvider>
    </Suspense>
  );
} 