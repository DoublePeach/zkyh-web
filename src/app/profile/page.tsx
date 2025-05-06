'use client';

/**
 * @description 用户个人中心页面
 * @author 郝桃桃
 * @date 2024-05-30
 */

import { useAuthStore } from '@/store/use-auth-store';
import { useRouter } from 'next/navigation';
import { 
  Clock, 
  Calendar, 
  BookOpen, 
  MessageCircle,
  Settings, 
  LogOut, 
  ChevronRight,
  ShieldCheck,
  Award,
  Bell,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import Link from 'next/link';
import { LoginModal } from '@/components/forms/login-modal';

export default function ProfilePage() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  // 在客户端渲染时检查登录状态
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);
  
  // 处理登出
  const handleLogout = () => {
    logout();
    toast.success('已成功登出');
    router.push('/');
  };
  
  // 如果未登录，显示登录提示
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">请先登录</h1>
          <p className="text-gray-500 mb-4">您需要登录才能访问个人中心</p>
          <LoginModal />
        </div>
      </div>
    );
  }
  
  const menuItems = [
    {
      icon: Clock,
      title: '我的学习记录',
      description: '查看学习进度和历史',
      href: '/learn',
    },
    {
      icon: Calendar,
      title: '我的备考计划',
      description: '查看和管理备考计划',
      href: '/study-plan',
    },
    {
      icon: BookOpen,
      title: '学习资料',
      description: '查看收藏的学习资料',
      href: '/learn',
    },
    {
      icon: MessageCircle,
      title: '我的消息',
      description: '查看系统通知和消息',
      href: '#',
    },
    {
      icon: Bell,
      title: '提醒设置',
      description: '管理学习提醒和通知',
      href: '#',
    },
    {
      icon: Award,
      title: '学习成就',
      description: '查看获得的学习徽章',
      href: '#',
    },
    {
      icon: ShieldCheck,
      title: '账号安全',
      description: '管理密码和安全设置',
      href: '#',
    },
    {
      icon: HelpCircle,
      title: '帮助与反馈',
      description: '常见问题与意见反馈',
      href: '#',
    },
    {
      icon: Settings,
      title: '设置',
      description: '管理应用偏好设置',
      href: '#',
    },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* 用户信息头部 */}
      <div className="bg-white p-4 mb-4 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mb-3">
          {user?.username?.[0].toUpperCase() || 'U'}
        </div>
        
        <h1 className="text-xl font-bold">{user?.username || '用户'}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {user?.profession || '医疗类'} | {user?.currentTitle || '初级'} → {user?.targetTitle || '中级'}
        </p>
        
        <div className="mt-4 w-full max-w-sm grid grid-cols-3 gap-2 text-center">
          <div className="p-2">
            <div className="text-lg font-bold">0</div>
            <div className="text-xs text-gray-500">学习天数</div>
          </div>
          <div className="p-2">
            <div className="text-lg font-bold">0</div>
            <div className="text-xs text-gray-500">已学知识点</div>
          </div>
          <div className="p-2">
            <div className="text-lg font-bold">0%</div>
            <div className="text-xs text-gray-500">总体进度</div>
          </div>
        </div>
      </div>
      
      {/* 菜单列表 */}
      <div className="px-4">
        <div className="bg-white rounded-md overflow-hidden">
          {menuItems.map((item, index) => (
            <Link 
              key={index} 
              href={item.href}
              className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                  <item.icon size={20} />
                </div>
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>
          ))}
        </div>
        
        {/* 退出登录按钮 */}
        <Button 
          variant="destructive" 
          className="w-full mt-6 mb-10"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" /> 退出登录
        </Button>
      </div>
    </div>
  );
} 