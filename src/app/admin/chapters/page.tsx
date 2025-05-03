/**
 * @description 章节管理页面
 * @author 郝桃桃
 * @date 2024-05-23
 */
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllChapters, deleteChapter, Chapter } from "@/lib/services/chapter-service";
import { getAllNursingDisciplines, NursingDiscipline } from "@/lib/services/nursing-discipline-service";

export default function ChaptersPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [disciplines, setDisciplines] = useState<NursingDiscipline[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isDisciplinesLoading, setIsDisciplinesLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // 加载所有护理学科
  useEffect(() => {
    async function loadDisciplines() {
      try {
        const response = await getAllNursingDisciplines();
        if (response.success && response.data) {
          setDisciplines(response.data);
        } else {
          toast.error("获取护理学科失败: " + (response.error || "未知错误"));
        }
      } catch (error) {
        console.error("获取护理学科出错:", error);
        toast.error("获取护理学科列表失败");
      } finally {
        setIsDisciplinesLoading(false);
      }
    }

    loadDisciplines();
  }, []);

  // 加载章节数据
  const loadChapters = async () => {
    setIsLoading(true);
    try {
      // 如果选择了特定的学科，则按学科ID筛选
      const disciplineId = selectedDiscipline !== "all" ? parseInt(selectedDiscipline) : undefined;
      const response = await getAllChapters(disciplineId);
      
      if (response.success && response.data) {
        setChapters(response.data);
      } else {
        toast.error("获取章节数据失败: " + (response.error || "未知错误"));
      }
    } catch (error) {
      console.error("获取章节数据出错:", error);
      toast.error("获取章节数据失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 当选择的学科变化时，重新加载章节数据
  useEffect(() => {
    if (!isDisciplinesLoading) {
      loadChapters();
    }
  }, [selectedDiscipline, isDisciplinesLoading]);

  // 删除章节
  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除此章节吗？此操作不可恢复，且会删除与此章节关联的所有知识点。")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await deleteChapter(id);
      if (response.success) {
        toast.success("章节删除成功");
        loadChapters();
      } else {
        toast.error("删除章节失败: " + (response.error || "未知错误"));
      }
    } catch (error) {
      console.error("删除章节出错:", error);
      toast.error("删除章节失败");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">章节管理</h1>
          <p className="text-muted-foreground">
            管理各护理学科的章节内容
          </p>
        </div>
        <Link
          href="/admin/chapters/new"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          添加章节
        </Link>
      </div>

      <div className="mb-6">
        <label 
          htmlFor="discipline-select" 
          className="mb-2 block text-sm font-medium"
        >
          选择护理学科
        </label>
        <Select 
          value={selectedDiscipline} 
          onValueChange={setSelectedDiscipline}
          disabled={isLoading || isDisciplinesLoading}
        >
          <SelectTrigger id="discipline-select" className="w-[300px]">
            <SelectValue placeholder="请选择护理学科" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有学科</SelectItem>
            {disciplines.map((discipline) => (
              <SelectItem 
                key={discipline.id} 
                value={discipline.id.toString()}
              >
                {discipline.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <table className="w-full divide-y divide-border">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium">章节名称</th>
              <th className="px-4 py-3 text-left text-sm font-medium">描述</th>
              <th className="px-4 py-3 text-left text-sm font-medium">所属学科</th>
              <th className="px-4 py-3 text-left text-sm font-medium">顺序</th>
              <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading || isDisciplinesLoading ? (
              <tr>
                <td className="px-4 py-3 text-sm" colSpan={6}>
                  加载中...
                </td>
              </tr>
            ) : chapters.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-sm" colSpan={6}>
                  {selectedDiscipline !== "all" ? "该学科下暂无章节数据，请添加" : "暂无章节数据，请选择学科并添加"}
                </td>
              </tr>
            ) : (
              chapters.map((chapter) => (
                <tr key={chapter.id}>
                  <td className="px-4 py-3 text-sm">{chapter.id}</td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {chapter.name}
                  </td>
                  <td className="px-4 py-3 text-sm">{chapter.description}</td>
                  <td className="px-4 py-3 text-sm">{chapter.disciplineName}</td>
                  <td className="px-4 py-3 text-sm">{chapter.orderIndex}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/chapters/${chapter.id}/edit`}
                        className="text-blue-600 hover:underline"
                      >
                        编辑
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link
                        href={`/admin/chapters/${chapter.id}/knowledge-points`}
                        className="text-green-600 hover:underline"
                      >
                        知识点
                      </Link>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => handleDelete(chapter.id)}
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