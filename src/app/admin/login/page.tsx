/**
 * @description 管理员登录页面
 * @author 郝桃桃
 * @date 2024-05-29
 */
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const formSchema = z.object({
  username: z.string().min(1, '请输入管理员用户名'),
  password: z.string().min(1, '请输入密码'),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });
  
  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include', // 确保发送和接收cookie
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '登录失败');
      }
      
      const result = await response.json();
      
      // 检查是否为管理员账户
      if (result.isAdmin) {
        toast.success('管理员登录成功');
        router.push('/admin/dashboard');
      } else {
        // 普通用户无权访问
        toast.error('普通用户无权访问管理后台');
      }
    } catch (error) {
      console.error('登录错误:', error);
      toast.error(error instanceof Error ? error.message : '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-gray-200 bg-white p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">管理员登录</h1>
          <p className="mt-2 text-sm text-gray-600">请登录管理员账号以访问后台系统</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>管理员用户名</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入管理员用户名" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密码</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="请输入密码" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? '登录中...' : '管理员登录'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
} 