/**
 * @description 每日学习任务详情组件
 * @author 郝桃桃
 * @date 2024-08-20
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Book, Clock, CheckCircle, BookOpen, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

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

interface DailyTaskDetailProps {
  isOpen: boolean;
  onClose: () => void;
  dailyPlan: DailyPlan | null;
  formattedDate: string;
  onTaskComplete: (taskIndex: number) => void;
  planId: string;
}

export default function DailyTaskDetail({
  isOpen,
  onClose,
  dailyPlan,
  formattedDate,
  onTaskComplete,
  planId
}: DailyTaskDetailProps) {
  const [loading, setLoading] = useState(false);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [activeTab, setActiveTab] = useState('tasks');

  useEffect(() => {
    const fetchKnowledgePoints = async () => {
      if (!dailyPlan) return;
      
      // 只有当打开对话框并且有学习科目时才获取知识点
      if (isOpen && dailyPlan.subjects.length > 0) {
        setLoading(true);
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
            setKnowledgePoints(data.data.knowledgePoints);
          }
        } catch (error) {
          console.error('获取知识点失败:', error);
          toast.error('无法加载相关知识点');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchKnowledgePoints();
  }, [isOpen, dailyPlan, planId]);

  // 关闭对话框时重置状态
  const handleClose = () => {
    setActiveTab('tasks');
    onClose();
  };

  // 如果没有日计划，只显示日期
  if (!dailyPlan) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{formattedDate} - 学习安排</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <p className="text-muted-foreground">当日无学习任务安排，休息一下吧！</p>
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const completedTaskCount = dailyPlan.tasks.filter(task => task.isCompleted).length;
  const totalTasks = dailyPlan.tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTaskCount / totalTasks) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="md:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{formattedDate} - {dailyPlan.title}</DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-muted-foreground">学习进度: {progress}% ({completedTaskCount}/{totalTasks})</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>学习任务 ({dailyPlan.tasks.length})</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="knowledge">
              <div className="flex items-center gap-2">
                <Book className="h-4 w-4" />
                <span>知识点 ({knowledgePoints.length})</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-1">今日学习主题:</h3>
              <div className="flex flex-wrap gap-2">
                {dailyPlan.subjects.map((subject, idx) => (
                  <span key={idx} className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                    {subject}
                  </span>
                ))}
              </div>
            </div>

            {dailyPlan.tasks.length > 0 ? (
              <div className="space-y-4">
                {dailyPlan.tasks.map((task, index) => (
                  <Card key={index} className={`border ${task.isCompleted ? 'bg-gray-50 border-gray-200' : 'border-gray-200'}`}>
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
                            onClick={() => onTaskComplete(index)}
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
            ) : (
              <p className="text-center py-8 text-gray-500">今日无学习任务</p>
            )}

            {dailyPlan.reviewTips && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-md">
                <h3 className="text-sm font-medium flex items-center gap-1 text-amber-800">
                  <Lightbulb className="h-4 w-4" />
                  <span>复习建议</span>
                </h3>
                <p className="text-sm mt-1 text-amber-700">{dailyPlan.reviewTips}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="knowledge" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent animate-spin rounded-full"></div>
                <span className="ml-3 text-gray-500">加载知识点...</span>
              </div>
            ) : knowledgePoints.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {knowledgePoints.map((kp) => (
                  <AccordionItem key={kp.id} value={`kp-${kp.id}`}>
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="text-left">
                        <div className="font-medium">{kp.title}</div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                          <span>{kp.subjectName}</span>
                          <span>•</span>
                          <span>{kp.chapterName}</span>
                          <span>•</span>
                          <span>重要度: {kp.importance}</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm">
                      <div className="pb-2 whitespace-pre-line">{kp.content}</div>
                      
                      {kp.keywords && kp.keywords.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs font-medium text-gray-500 mb-1">关键词:</p>
                          <div className="flex flex-wrap gap-1">
                            {kp.keywords.map((keyword, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">暂无相关知识点</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button onClick={handleClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 