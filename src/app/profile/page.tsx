'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/store/use-auth-store';
import { useRouter } from 'next/navigation';
import { User, Book, Settings, LogOut, Award } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  // 简单样例数据
  const stats = {
    completedTasks: 32,
    totalTasks: 120,
    studyHours: 24,
    testScores: 85,
  };
  
  // 处理登出
  const handleLogout = () => {
    logout();
    toast.success('已成功登出');
    router.push('/');
  };
  
  // 如果未登录，重定向到登录页
  if (!isAuthenticated) {
    // 在实际项目中使用React.useEffect进行重定向
    router.push('/login');
    return null;
  }
  
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">个人中心</h1>
            <p className="text-gray-600 mt-1">管理您的账号和学习进度</p>
          </div>
          <Button variant="destructive" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            退出登录
          </Button>
        </div>
        
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground p-2 rounded-full">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>{user?.username || '用户'}</CardTitle>
                  <CardDescription>{user?.profession || '医疗类'} | {user?.currentTitle || '护士'} → {user?.targetTitle || '主管护师'}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl font-bold">{stats.completedTasks}</span>
                  <span className="text-sm text-gray-500">已完成任务</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl font-bold">{stats.studyHours}</span>
                  <span className="text-sm text-gray-500">学习小时</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl font-bold">{stats.testScores}%</span>
                  <span className="text-sm text-gray-500">测验得分</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl font-bold">{Math.round(stats.completedTasks / stats.totalTasks * 100)}%</span>
                  <span className="text-sm text-gray-500">总体进度</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="progress" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="progress">
              <Book className="h-4 w-4 mr-2" />
              学习进度
            </TabsTrigger>
            <TabsTrigger value="achievements">
              <Award className="h-4 w-4 mr-2" />
              成就
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              设置
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>学习进度</CardTitle>
                <CardDescription>查看您的学习计划进度</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>总体进度</span>
                      <span>{stats.completedTasks}/{stats.totalTasks} 任务</span>
                    </div>
                    <Progress value={Math.round(stats.completedTasks / stats.totalTasks * 100)} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>基础知识复习</span>
                      <span>75%</span>
                    </div>
                    <Progress value={75} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>专科护理知识</span>
                      <span>40%</span>
                    </div>
                    <Progress value={40} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>实践能力提升</span>
                      <span>10%</span>
                    </div>
                    <Progress value={10} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="achievements">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">这里将显示您的学习成就</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>账号设置</CardTitle>
                <CardDescription>管理您的账号信息和偏好设置</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-gray-500">
                  账号设置功能将在后续版本中开放
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 