/**
 * @description 登录页面（重定向到首页，使用登录模态框）
 * @author 郝桃桃
 * @date 2024-05-30
 */
import { redirect } from 'next/navigation';

export default function LoginPage() {
  // 重定向到首页，因为现在使用登录模态框
  redirect('/');
} 