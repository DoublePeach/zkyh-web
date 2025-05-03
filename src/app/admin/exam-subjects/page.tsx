/**
 * @description 考试科目管理页面
 * @author 郝桃桃
 * @date 2024-05-23
 */
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface ExamSubject {
  id: number;
  name: string;
  description: string;
  weight: string;
}

export default function ExamSubjectsPage() {
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 这里模拟从API获取数据
    // 实际项目中应该使用fetch调用后端API
    setTimeout(() => {
      setSubjects([
        {
          id: 1,
          name: "专业知识",
          description: "医学基础知识与护理专业理论知识",
          weight: "45%",
        },
        {
          id: 2,
          name: "专业实践能力",
          description: "护理操作技能与实践应用",
          weight: "35%",
        },
        {
          id: 3,
          name: "现场论文答辩",
          description: "专业论文写作与现场答辩",
          weight: "10%",
        },
        {
          id: 4,
          name: "外语水平",
          description: "医学英语阅读与应用能力",
          weight: "10%",
        },
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">考试科目管理</h1>
          <p className="text-muted-foreground">
            管理护理职称考试的四个科目
          </p>
        </div>
        <Link
          href="/admin/exam-subjects/new"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          添加科目
        </Link>
      </div>

      <div className="rounded-md border">
        <table className="w-full divide-y divide-border">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium">科目名称</th>
              <th className="px-4 py-3 text-left text-sm font-medium">描述</th>
              <th className="px-4 py-3 text-left text-sm font-medium">考试权重</th>
              <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td className="px-4 py-3 text-sm" colSpan={5}>
                  加载中...
                </td>
              </tr>
            ) : subjects.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-sm" colSpan={5}>
                  暂无科目数据，请添加
                </td>
              </tr>
            ) : (
              subjects.map((subject) => (
                <tr key={subject.id}>
                  <td className="px-4 py-3 text-sm">{subject.id}</td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {subject.name}
                  </td>
                  <td className="px-4 py-3 text-sm">{subject.description}</td>
                  <td className="px-4 py-3 text-sm">{subject.weight}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/exam-subjects/${subject.id}/edit`}
                        className="text-blue-600 hover:underline"
                      >
                        编辑
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link
                        href={`/admin/exam-subjects/${subject.id}/delete`}
                        className="text-red-600 hover:underline"
                      >
                        删除
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 