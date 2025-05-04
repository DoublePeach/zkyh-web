"use client";

/**
 * @description 管理后台客户端布局组件
 * @author 郝桃桃
 * @date 2024-05-24
 */
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

// 后台导航链接
const navLinks = [
  { href: "/admin/dashboard", label: "仪表盘" },
  { href: "/admin/exam-subjects", label: "考试科目" },
  { href: "/admin/nursing-disciplines", label: "护理学科" },
  { href: "/admin/chapters", label: "章节管理" },
  { href: "/admin/knowledge-points", label: "知识点" },
  { href: "/admin/test-banks", label: "题库管理" },
  { href: "/admin/exam-papers", label: "试卷管理" },
  { href: "/admin/quiz-questions", label: "试题管理" },
  { href: "/admin/users", label: "用户管理" },
  { href: "/admin/study-plans", label: "学习计划" },
];

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-6">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <Link href="/admin/dashboard" className="text-lg sm:text-xl font-bold">
              医卫职称备考助手
            </Link>
            <span className="hidden sm:inline text-gray-500">管理后台</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">管理员</span>
            <Link
              href="/api/admin/logout"
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              退出登录
            </Link>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        {/* 桌面端侧边栏 - 只在md以上显示 */}
        <nav className="hidden md:block w-64 border-r bg-gray-50">
          <div className="flex flex-col p-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200",
                  {
                    "bg-gray-200": pathname === link.href,
                  }
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
        
        {/* 移动端菜单 - 仅在md以下且菜单打开时显示 */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-white md:hidden">
            <div className="flex items-center justify-between h-16 border-b px-4">
              <span className="text-lg font-bold">导航菜单</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <nav className="p-4">
              <div className="flex flex-col space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-md px-3 py-3 text-base font-medium text-gray-700 hover:bg-gray-100",
                      {
                        "bg-gray-100 text-primary": pathname === link.href,
                      }
                    )}
                    onClick={toggleMobileMenu}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        )}
        
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
} 