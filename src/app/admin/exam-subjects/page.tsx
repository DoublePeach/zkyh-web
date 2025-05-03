/**
 * @description 考试科目管理页面
 * @author 郝桃桃
 * @date 2024-05-23
 */
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getAllExamSubjects, deleteExamSubject, ExamSubject } from "@/lib/services/exam-subject-service";
import { toast } from "sonner";

export default function ExamSubjectsPage() {
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // 加载考试科目数据
  const loadSubjects = async () => {
    setIsLoading(true);
    try {
      const response = await getAllExamSubjects();
      if (response.success && response.data) {
        setSubjects(response.data);
      } else {
        toast.error("获取考试科目失败: " + (response.error || "未知错误"));
      }
    } catch (error) {
      console.error("获取考试科目出错:", error);
      toast.error("获取考试科目失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadSubjects();
  }, []);

  // 删除考试科目
  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除此考试科目吗？此操作不可恢复。")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await deleteExamSubject(id);
      if (response.success) {
        toast.success("考试科目删除成功");
        // 重新加载数据
        loadSubjects();
      } else {
        toast.error("删除考试科目失败: " + (response.error || "未知错误"));
      }
    } catch (error) {
      console.error("删除考试科目出错:", error);
      toast.error("删除考试科目失败");
    } finally {
      setIsDeleting(false);
    }
  };

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
                      <button
                        onClick={() => handleDelete(subject.id)}
                        disabled={isDeleting}
                        className="text-red-600 hover:underline disabled:opacity-50"
                      >
                        删除
                      </button>
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