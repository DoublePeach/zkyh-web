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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const formSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符'),
  password: z.string().min(8, '密码至少8个字符'),
  profession: z.enum(['medical', 'nursing', 'pharmacy'], {
    required_error: '请选择专业类别',
  }),
  currentTitle: z.string().min(1, '请选择当前职称'),
  targetTitle: z.string().min(1, '请选择目标职称'),
});

type FormValues = z.infer<typeof formSchema>;

export function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
      profession: 'medical',
      currentTitle: '',
      targetTitle: '',
    },
  });
  
  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '注册失败');
      }
      
      toast.success('注册成功，请登录');
      router.push('/login');
    } catch (error) {
      console.error('注册错误:', error);
      toast.error(error instanceof Error ? error.message : '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>用户名</FormLabel>
              <FormControl>
                <Input placeholder="请输入用户名" {...field} />
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
        
        <FormField
          control={form.control}
          name="profession"
          render={({ field }) => (
            <FormItem>
              <FormLabel>专业类别</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择专业类别" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="medical">医疗类</SelectItem>
                  <SelectItem value="nursing">护理类</SelectItem>
                  <SelectItem value="pharmacy">药技类</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="currentTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>当前职称</FormLabel>
              <FormControl>
                <Input placeholder="请输入当前职称" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="targetTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>目标职称</FormLabel>
              <FormControl>
                <Input placeholder="请输入目标职称" {...field} />
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
          {loading ? '注册中...' : '注册'}
        </Button>
      </form>
    </Form>
  );
} 