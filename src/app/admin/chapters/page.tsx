/**
 * @description 章节管理页面
 * @author 郝桃桃
 * @date 2024-05-23
 */
"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAllChapters, deleteChapter, Chapter } from "@/lib/services/chapter-service";
import { getAllNursingDisciplines, NursingDiscipline } from "@/lib/services/nursing-discipline-service";

export default function ChaptersPage() {
  // 数据状态
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [disciplines, setDisciplines] = useState<NursingDiscipline[]>([]);
  
  // 筛选状态
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  const [isDisciplinesLoading, setIsDisciplinesLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // 计算总页数和当前页显示的章节
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(chapters.length / itemsPerPage));
  }, [chapters.length, itemsPerPage]);

  const currentPageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return chapters.slice(startIndex, startIndex + itemsPerPage);
  }, [chapters, currentPage, itemsPerPage]);

  // 加载所有护理学科
  useEffect(() => {
    async function loadDisciplines() {
      setIsDisciplinesLoading(true);
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
  const fetchChapters = useCallback(async () => {
    setIsLoading(true);
    try {
      const disciplineId = selectedDiscipline !== "all" ? parseInt(selectedDiscipline) : undefined;
      const response = await getAllChapters(disciplineId);
      
      if (response.success && response.data) {
        setChapters(response.data);
        
        // 如果当前页超出范围，重置为第一页
        const newTotalPages = Math.ceil(response.data.length / itemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(1);
        }
      } else {
        toast.error("获取章节数据失败: " + (response.error || "未知错误"));
        setChapters([]);
      }
    } catch (error) {
      console.error("获取章节数据出错:", error);
      toast.error("获取章节数据失败");
      setChapters([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDiscipline, currentPage, itemsPerPage]);

  // 当选择的学科变化时，重新加载章节数据
  useEffect(() => {
    if (!isDisciplinesLoading) {
      fetchChapters();
    }
  }, [isDisciplinesLoading, fetchChapters]);

  // 删除章节
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("确定要删除此章节吗？此操作不可恢复，且会删除与此章节关联的所有知识点。")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await deleteChapter(id);
      if (response.success) {
        toast.success("章节删除成功");
        fetchChapters(); // 删除后重新加载数据
      } else {
        toast.error("删除章节失败: " + (response.error || "未知错误"));
      }
    } catch (error) {
      console.error("删除章节出错:", error);
      toast.error("删除章节失败");
    } finally {
      setIsDeleting(false);
    }
  }, [fetchChapters]);

  // 分页控制
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 处理学科选择变化
  const handleDisciplineChange = (value: string) => {
    setSelectedDiscipline(value);
    setCurrentPage(1); // 重置到第一页
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
          onValueChange={handleDisciplineChange}
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
              <th className="px-4 py-3 text-left text-sm font-medium">序号</th>
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
            ) : currentPageItems.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-sm" colSpan={6}>
                  {selectedDiscipline !== "all" ? "该学科下暂无章节数据，请添加" : "暂无章节数据，请选择学科并添加"}
                </td>
              </tr>
            ) : (
              currentPageItems.map((chapter, index) => (
                <tr key={chapter.id}>
                  <td className="px-4 py-3 text-sm">{(currentPage - 1) * itemsPerPage + index + 1}</td>
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
                        href={`/admin/knowledge-points?chapterId=${chapter.id}`}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            第 {currentPage} 页 / 共 {totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
} 