import { LoginForm } from '@/components/forms/login-form';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">账号登录</h1>
        <p className="text-sm text-gray-500">
          登录您的账号，管理员和学员均可使用此入口
        </p>
      </div>
      
      <LoginForm />
      
      <div className="text-center text-sm">
        没有账号？{' '}
        <Link href="/register" className="text-primary hover:underline">
          立即注册
        </Link>
      </div>
    </div>
  );
} 