import { RegisterForm } from '@/components/forms/register-form';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">创建账号</h1>
        <p className="text-sm text-gray-500">
          注册一个账号，开始您的备考之旅
        </p>
      </div>
      
      <RegisterForm />
      
      <div className="text-center text-sm">
        已有账号？{' '}
        <Link href="/login" className="text-primary hover:underline">
          立即登录
        </Link>
      </div>
    </div>
  );
} 