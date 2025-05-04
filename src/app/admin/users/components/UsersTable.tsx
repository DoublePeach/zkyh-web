"use client";

/**
 * @description 用户列表表格组件
 * @author 郝桃桃
 * @date 2024-05-27
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, ToggleLeft, ToggleRight, UserCog, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { Switch } from "@/components/ui/switch"; // For toggling status
import { Label } from "@/components/ui/label";

// Define the expected shape of a user item from the combined API
interface UserItem {
  id: number;
  username: string;
  name?: string | null; // Admin only
  role?: string | null; // Admin only
  profession?: string | null; // Regular only
  currentTitle?: string | null; // Regular only
  targetTitle?: string | null; // Regular only
  isActive: boolean;
  lastLogin?: string | null; // Admin only
  createdAt: string;
  updatedAt: string;
  userType: 'admin' | 'regular';
}

async function fetchUsers(): Promise<UserItem[]> {
  const response = await fetch('/api/admin/users');
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch users');
  }
  return result.data || [];
}

async function updateUserStatus(id: number, isActive: boolean): Promise<UserItem> {
    const response = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update user status');
    }
     const result = await response.json();
     if (!result.success) {
        throw new Error(result.error || result.message || 'Failed to update user status');
    }
    return result.data;
  }

export default function UsersTable() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setIsLoading(true);
    fetchUsers()
      .then(data => {
        setUsers(data);
        setError(null);
      })
      .catch(err => {
        console.error("Error fetching users:", err);
        setError(err.message || '加载用户列表时出错');
        toast.error("加载失败", { description: err.message || '加载用户列表时出错' });
      })
      .finally(() => setIsLoading(false));
  }, []);

 const handleStatusToggle = async (id: number, currentStatus: boolean) => {
    const optimisticNewStatus = !currentStatus;
    // Optimistic update
    setUsers(prevUsers => 
        prevUsers.map(user => 
            user.id === id ? { ...user, isActive: optimisticNewStatus } : user
        )
    );

    try {
      await updateUserStatus(id, optimisticNewStatus);
      toast.success("状态更新成功", { description: `用户 ID: ${id} 状态已更新为 ${optimisticNewStatus ? '激活' : '禁用'}` });
      // No need to setUsers again as optimistic update is already done
    } catch (err: any) {
      console.error("Error updating user status:", err);
      toast.error("状态更新失败", { description: err.message || '更新用户状态时发生错误' });
      // Revert optimistic update on error
       setUsers(prevUsers => 
        prevUsers.map(user => 
            user.id === id ? { ...user, isActive: currentStatus } : user
        )
    );
    }
  };

  // Helper to format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
        return new Date(dateString).toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return dateString;
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">加载中...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">错误: {error}</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>用户名</TableHead>
          <TableHead>类型</TableHead>
          <TableHead>姓名/职称</TableHead> {/* Combined column */}
          <TableHead>状态</TableHead>
          <TableHead>创建时间</TableHead>
          {/* <TableHead>更新时间</TableHead> */}
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length > 0 ? (
          users.map((user) => (
            <TableRow key={`${user.userType}-${user.id}`}>
              <TableCell className="font-medium">{user.id}</TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>
                 <Badge variant={user.userType === 'admin' ? 'destructive' : 'outline'} className="text-xs">
                    {user.userType === 'admin' ? <UserCog className="h-3 w-3 mr-1"/> : <User className="h-3 w-3 mr-1"/>}
                    {user.userType === 'admin' ? '管理员' : '普通用户'}
                </Badge>
              </TableCell>
              <TableCell>{user.userType === 'admin' ? user.name : user.profession || '-'}</TableCell>
              <TableCell>
                 <div className="flex items-center space-x-2">
                    <Switch 
                        id={`status-${user.userType}-${user.id}`}
                        checked={user.isActive}
                        onCheckedChange={(checked: boolean) => handleStatusToggle(user.id, user.isActive)}
                    />
                    <Label htmlFor={`status-${user.userType}-${user.id}`} className="text-xs">
                         {user.isActive ? '激活' : '禁用'}
                    </Label>
                 </div>
              </TableCell>
              <TableCell>{formatDate(user.createdAt)}</TableCell>
              {/* <TableCell>{formatDate(user.updatedAt)}</TableCell> */}
              <TableCell className="text-right">
                {/* Add edit/view actions if needed */}
                 <Button variant="ghost" size="icon" className="h-8 w-8 p-0" disabled>
                     <span className="sr-only">编辑用户</span>
                     <MoreHorizontal className="h-4 w-4" />
                 </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7} className="h-24 text-center">
              暂无用户数据。
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
} 