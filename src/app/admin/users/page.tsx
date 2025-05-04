/**
 * @description 用户管理列表页面
 * @author 郝桃桃
 * @date 2024-05-27
 */
// import Link from 'next/link';
// import { Plus } from 'lucide-react';
// import { Button } from '@/components/ui/button';
import UsersTable from './components/UsersTable'; // We'll create this next

// This is a Server Component by default
export default function UsersPage() {

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">用户管理</h1>
        {/* Add button for creating new ADMIN user if needed */}
        {/* <Button asChild>
          <Link href="/admin/users/new">
            <Plus className="mr-2 h-4 w-4" /> 新建管理员
          </Link>
        </Button> */}
      </div>
      <p className="text-sm text-muted-foreground">
        查看和管理系统中的所有用户（包括管理员和普通注册用户）。
      </p>

      <UsersTable /> 
    </div>
  );
} 