/**
 * @description 管理后台仪表盘页面
 * @author 郝桃桃
 * @date 2024-05-23
 */
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db"; // Import db instance
import { knowledgePoints, testBanks, examSubjects, nursingDisciplines, quizQuestions, users, adminUsers } from "@/db/schema/index"; // Import schemas
import { count } from "drizzle-orm"; // Import count aggregator

// Make the component async to fetch data
export default async function AdminDashboardPage() {

  // Fetch counts concurrently
  const [knowledgePointCountResult, testBankCountResult, subjectCountResult, disciplineCountResult, questionCountResult, userCountResult, adminCountResult] = await Promise.allSettled([
    db.select({ value: count() }).from(knowledgePoints),
    db.select({ value: count() }).from(testBanks),
    db.select({ value: count() }).from(examSubjects),
    db.select({ value: count() }).from(nursingDisciplines),
    db.select({ value: count() }).from(quizQuestions),
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(adminUsers),
  ]);

  // Helper to safely get count or return 0
  const getCount = (result: PromiseSettledResult<{ value: number }[]>) => {
      if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
          return result.value[0].value;
      }
      console.error("Failed to fetch count:", result.status === 'rejected' ? result.reason : 'Unknown error');
      return 0;
  }

  const knowledgePointCount = getCount(knowledgePointCountResult);
  const testBankCount = getCount(testBankCountResult);
  const subjectCount = getCount(subjectCountResult);
  const disciplineCount = getCount(disciplineCountResult);
  const questionCount = getCount(questionCountResult);
  const regularUserCount = getCount(userCountResult);
  const adminUserCount = getCount(adminCountResult);
  const totalUserCount = regularUserCount + adminUserCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">后台管理仪表盘</h1>
        <p className="text-muted-foreground">
          管理智考引航的所有内容和资源
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">考试科目</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Display actual count */}
            <div className="text-2xl font-bold">{subjectCount}</div>
            <p className="text-xs text-muted-foreground">
              职称考试的考试科目管理
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
             {/* Display actual count */}
            <div className="text-2xl font-bold">{disciplineCount}</div>
            <p className="text-xs text-muted-foreground">
              护理学科的内容管理
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
            {/* Display actual count */}
            <div className="text-2xl font-bold">{knowledgePointCount}</div>
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
            {/* Display actual count */}
            <div className="text-2xl font-bold">{testBankCount}</div>
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
            {/* Display actual count */}
            <div className="text-2xl font-bold">{questionCount}</div>
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
             {/* Display actual count */}
            <div className="text-2xl font-bold">{totalUserCount}</div>
            <p className="text-xs text-muted-foreground">
              管理系统注册用户 ({regularUserCount} 普通 / {adminUserCount} 管理员)
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