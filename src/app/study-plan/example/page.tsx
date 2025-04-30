'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { CalendarDays, BookOpen, Star, CheckCircle2 } from 'lucide-react';

export default function StudyPlanPage() {
  // 示例数据
  const studyPlan = {
    title: '主管护师职称备考计划',
    overview: '这是一个针对主管护师职称考试的90天备考计划，覆盖所有考试科目，并根据您的个人情况进行了优化。',
    totalDays: 90,
    startDate: '2023-07-01',
    endDate: '2023-09-28',
    progress: 0,
    modules: [
      {
        id: 1,
        title: '基础知识复习',
        description: '复习护理学基础知识和相关理论',
        importance: 9,
        difficulty: 7,
        durationDays: 30,
        tasks: [
          { id: 1, title: '人体解剖生理学基础', completed: false },
          { id: 2, title: '基础护理技术', completed: false },
          { id: 3, title: '护理学导论', completed: false },
        ]
      },
      {
        id: 2,
        title: '专科护理知识',
        description: '复习内科、外科、妇产科等专科护理知识',
        importance: 10,
        difficulty: 8,
        durationDays: 40,
        tasks: [
          { id: 4, title: '内科护理学', completed: false },
          { id: 5, title: '外科护理学', completed: false },
          { id: 6, title: '妇产科护理学', completed: false },
        ]
      },
      {
        id: 3,
        title: '实践能力提升',
        description: '提高实践操作能力和应急处理能力',
        importance: 8,
        difficulty: 9,
        durationDays: 20,
        tasks: [
          { id: 7, title: '护理应急处理', completed: false },
          { id: 8, title: '护理管理与教学', completed: false },
          { id: 9, title: '护理科研方法', completed: false },
        ]
      },
    ]
  };
  
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">备考规划总览</h1>
          <Link href="/learn">
            <Button>开始学习之旅</Button>
          </Link>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{studyPlan.title}</CardTitle>
            <CardDescription>{studyPlan.overview}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span className="font-medium">总学习天数</span>
                </div>
                <p className="text-2xl font-bold">{studyPlan.totalDays}天</p>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="font-medium">学习进度</span>
                </div>
                <div className="space-y-2">
                  <Progress value={studyPlan.progress} />
                  <p className="text-sm text-gray-500">{studyPlan.progress}% 完成</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="font-medium">学习时间</span>
                </div>
                <p className="text-sm">
                  {studyPlan.startDate} 至 {studyPlan.endDate}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <h2 className="text-xl font-bold mb-4">学习模块</h2>
        
        <div className="space-y-4">
          {studyPlan.modules.map((module) => (
            <Card key={module.id}>
              <CardHeader>
                <CardTitle className="text-lg">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="font-medium">重要性：</span>
                      <span className="text-amber-500">{Array(module.importance).fill('★').join('')}</span>
                    </div>
                    <div>
                      <span className="font-medium">难度：</span>
                      <span className="text-blue-500">{Array(module.difficulty).fill('★').join('')}</span>
                    </div>
                    <div>
                      <span className="font-medium">持续天数：</span>
                      <span>{module.durationDays}天</span>
                    </div>
                  </div>
                </div>
                
                <h3 className="font-medium mb-2 text-sm">任务列表：</h3>
                <ul className="space-y-2">
                  {module.tasks.map((task) => (
                    <li key={task.id} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-gray-300" />
                      <span>{task.title}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 