/**
 * @description 用户注册页面，提供注册表单和登录链接。
 * @author 郝桃桃
 * @date 2024-07-15
 */
import { RegisterForm } from '@/components/forms/register-form';
import Link from 'next/link';

/**
 * @component RegisterPage
 * @description 用户注册页面的主组件，包含注册表单及导航到登录页面的链接。
 * @returns {JSX.Element}
 */
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