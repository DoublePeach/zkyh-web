/**
 * @description 登录模态框组件
 * @author 郝桃桃
 * @date 2024-05-30
 */
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { LoginForm } from './login-form';
import { useState } from 'react';
import { useAuthStore } from '@/store/use-auth-store';

export function LoginModal() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  
  // 如果已登录，不显示登录按钮
  if (isAuthenticated) {
    return null;
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          登录
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">登录</DialogTitle>
        </DialogHeader>
        <LoginForm onLoginSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
} 