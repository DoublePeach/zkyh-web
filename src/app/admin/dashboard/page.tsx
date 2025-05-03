/**
 * @description 管理后台仪表盘页面
 * @author 郝桃桃
 * @date 2024-05-23
 */
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">后台管理仪表盘</h1>
        <p className="text-muted-foreground">
          管理医卫职称备考助手的所有内容和资源
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">考试科目</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">
              职称考试的四个考试科目管理
            </p>
            <Link
              href="/admin/exam-subjects"
              className="mt-2 block text-sm text-blue-600 hover:underline"
            >
              管理科目
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">护理学科</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">
              六个护理学科的内容管理
            </p>
            <Link
              href="/admin/nursing-disciplines"
              className="mt-2 block text-sm text-blue-600 hover:underline"
            >
              管理学科
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">知识点</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              管理所有章节的知识点
            </p>
            <Link
              href="/admin/knowledge-points"
              className="mt-2 block text-sm text-blue-600 hover:underline"
            >
              管理知识点
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">题库</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              各科目题库管理
            </p>
            <Link
              href="/admin/test-banks"
              className="mt-2 block text-sm text-blue-600 hover:underline"
            >
              管理题库
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">试题</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              管理所有题库的试题
            </p>
            <Link
              href="/admin/quiz-questions"
              className="mt-2 block text-sm text-blue-600 hover:underline"
            >
              管理试题
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">用户</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              管理系统注册用户
            </p>
            <Link
              href="/admin/users"
              className="mt-2 block text-sm text-blue-600 hover:underline"
            >
              管理用户
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}