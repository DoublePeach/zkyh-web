"use client";

/**
 * @description 知识点管理内容组件 (客户端组件)
 * @author 郝桃桃
 * @date 2024-05-25
 */

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { 
  getAllKnowledgePoints, 
  deleteKnowledgePoint, 
  KnowledgePoint 
} from "@/lib/services/knowledge-point-service";
import { 
  getAllNursingDisciplines, 
  NursingDiscipline 
} from "@/lib/services/nursing-discipline-service";
import { 
  getAllChapters, 
  Chapter 
} from "@/lib/services/chapter-service";
import { 
  getAllExamSubjects, 
  ExamSubject 
} from "@/lib/services/exam-subject-service";

export default function KnowledgePointsContent() {
  const searchParams = useSearchParams();
  const initialChapterId = searchParams.get('chapterId');

  // 数据状态
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [disciplines, setDisciplines] = useState<NursingDiscipline[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  
  // 筛选状态
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");
  const [selectedChapter, setSelectedChapter] = useState<string>(initialChapterId || "all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // 计算总页数和当前页数据
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(knowledgePoints.length / itemsPerPage));
  }, [knowledgePoints.length, itemsPerPage]);
  
  const currentPageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return knowledgePoints.slice(startIndex, startIndex + itemsPerPage);
  }, [knowledgePoints, currentPage, itemsPerPage]);

  // 加载筛选条件（学科和科目）
  useEffect(() => {
    async function loadFilters() {
      setIsFilterLoading(true);
      try {
        const [disciplinesResponse, subjectsResponse] = await Promise.all([
          getAllNursingDisciplines(),
          getAllExamSubjects()
        ]);

        if (disciplinesResponse.success && disciplinesResponse.data) {
          setDisciplines(disciplinesResponse.data);
        } else {
          toast.error("获取护理学科失败");
        }

        if (subjectsResponse.success && subjectsResponse.data) {
          setSubjects(subjectsResponse.data);
        } else {
          toast.error("获取考试科目失败");
        }
      } catch (error) {
        console.error("初始化筛选项失败:", error);
        toast.error("加载数据失败");
      } finally {
        setIsFilterLoading(false);
      }
    }

    loadFilters();
  }, []);

  // 如果有初始章节ID，获取其所属学科
  useEffect(() => {
    if (initialChapterId && disciplines.length > 0) {
      async function fetchChapterDetail() {
        try {
          const response = await fetch(`/api/admin/chapters/${initialChapterId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data?.disciplineId) {
              const disciplineId = result.data.disciplineId.toString();
              setSelectedDiscipline(disciplineId);
            }
          }
        } catch (error) {
          console.error("获取初始章节详情失败:", error);
        }
      }
      
      fetchChapterDetail();
    }
  }, [initialChapterId, disciplines]);

  // 根据选择的学科加载章节
  useEffect(() => {
    if (selectedDiscipline === "all") {
      setChapters([]);
      // 仅当不是初始章节ID时才重置章节选择
      if (!initialChapterId || selectedChapter !== initialChapterId) {
        setSelectedChapter("all");
      }
      return;
    }

    async function loadChapters() {
      try {
        const disciplineId = parseInt(selectedDiscipline);
        const response = await getAllChapters(disciplineId);
        
        if (response.success && response.data) {
          setChapters(response.data);
          
          // 如果当前选择的章节不在新的章节列表中，重置选择
          if (selectedChapter !== "all" && 
              !response.data.some(c => c.id.toString() === selectedChapter) && 
              (!initialChapterId || selectedChapter !== initialChapterId)) {
            setSelectedChapter("all");
          }
        } else {
          setChapters([]);
          if (selectedChapter !== "all" && (!initialChapterId || selectedChapter !== initialChapterId)) {
            setSelectedChapter("all");
          }
        }
      } catch (error) {
        console.error("获取章节失败:", error);
        setChapters([]);
      }
    }
    
    loadChapters();
  }, [selectedDiscipline, selectedChapter, initialChapterId]);

  // 加载知识点
  const fetchKnowledgePoints = useCallback(async () => {
    setIsLoading(true);
    try {
      const options: {
        disciplineId?: number;
        chapterId?: number;
        subjectId?: number;
        search?: string;
      } = {};

      if (selectedDiscipline !== "all") options.disciplineId = parseInt(selectedDiscipline);
      if (selectedChapter !== "all") options.chapterId = parseInt(selectedChapter);
      if (selectedSubject !== "all") options.subjectId = parseInt(selectedSubject);
      if (searchTerm.trim()) options.search = searchTerm.trim();

      const response = await getAllKnowledgePoints(options);
      
      if (response.success && response.data) {
        setKnowledgePoints(response.data);
        
        // 如果当前页超出新的总页数范围，重置到第一页
        const newTotalPages = Math.ceil(response.data.length / itemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(1);
        }
      } else {
        toast.error("获取知识点失败");
        setKnowledgePoints([]);
      }
    } catch (error) {
      console.error("获取知识点出错:", error);
      toast.error("获取知识点失败");
      setKnowledgePoints([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDiscipline, selectedChapter, selectedSubject, searchTerm, itemsPerPage, currentPage]);

  // 当筛选条件变化时加载知识点
  useEffect(() => {
    if (!isFilterLoading) {
      fetchKnowledgePoints();
    }
  }, [fetchKnowledgePoints, isFilterLoading]);

  // 处理删除
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("确定要删除此知识点吗？此操作不可恢复。")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await deleteKnowledgePoint(id);
      if (response.success) {
        toast.success("知识点删除成功");
        fetchKnowledgePoints();
      } else {
        if (response.message?.includes("关联了试题")) {
          toast.error("删除失败：该知识点关联了试题，请先删除关联的试题");
        } else {
          toast.error(`删除失败: ${response.message || response.error || "未知错误"}`);
        }
      }
    } catch (error) {
      console.error("删除知识点出错:", error);
      toast.error("删除知识点失败");
    } finally {
      setIsDeleting(false);
    }
  }, [fetchKnowledgePoints]);

  // 筛选变更处理器
  const handleFilterChange = (type: string, value: string) => {
    switch (type) {
      case 'discipline':
        setSelectedDiscipline(value);
        // 仅当不是初始章节时才重置章节选择
        if (!initialChapterId || selectedChapter !== initialChapterId) {
          setSelectedChapter("all");
        }
        break;
      case 'chapter':
        setSelectedChapter(value);
        break;
      case 'subject':
        setSelectedSubject(value);
        break;
    }
    setCurrentPage(1); // 重置到第一页
  };

  // 搜索处理
  const handleSearch = () => {
    setCurrentPage(1);
    fetchKnowledgePoints();
  };

  // 重置筛选
  const resetFilters = () => {
    setSelectedDiscipline("all");
    setSelectedChapter("all");
    setSelectedSubject("all");
    setSearchTerm("");
    setCurrentPage(1);
  };

  // 分页控制
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 难度/重要度星星
  const renderStars = (count: number) => {
    return "★".repeat(count) + "☆".repeat(5 - count);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">知识点管理</h1>
          <p className="text-muted-foreground">管理各护理学科章节的知识点</p>
        </div>
        <Link
          href="/admin/knowledge-points/new"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          添加知识点
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium">护理学科</label>
          <Select 
            value={selectedDiscipline} 
            onValueChange={(value) => handleFilterChange('discipline', value)}
            disabled={isLoading || isFilterLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择学科" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部学科</SelectItem>
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

        <div>
          <label className="mb-2 block text-sm font-medium">章节</label>
          <Select 
            value={selectedChapter} 
            onValueChange={(value) => handleFilterChange('chapter', value)}
            disabled={isLoading || isFilterLoading || selectedDiscipline === "all" || chapters.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择章节" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部章节</SelectItem>
              {chapters.map((chapter) => (
                <SelectItem 
                  key={chapter.id} 
                  value={chapter.id.toString()}
                >
                  {chapter.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">考试科目</label>
          <Select 
            value={selectedSubject} 
            onValueChange={(value) => handleFilterChange('subject', value)}
            disabled={isLoading || isFilterLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择科目" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部科目</SelectItem>
              {subjects.map((subject) => (
                <SelectItem 
                  key={subject.id} 
                  value={subject.id.toString()}
                >
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">搜索</label>
          <div className="flex items-center gap-2">
            <Input
              placeholder="搜索知识点..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button 
              type="button" 
              size="icon" 
              onClick={handleSearch}
              disabled={isLoading}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          总数据: {knowledgePoints.length} | 总页数: {totalPages} | 当前页: {currentPage}
        </div>
        <Button 
          variant="outline" 
          onClick={resetFilters}
          disabled={isLoading || isFilterLoading}
        >
          重置筛选
        </Button>
      </div>

      <div className="rounded-md border">
        <table className="w-full divide-y divide-border">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">序号</th>
              <th className="px-4 py-3 text-left text-sm font-medium">标题</th>
              <th className="px-4 py-3 text-left text-sm font-medium">学科/章节</th>
              <th className="px-4 py-3 text-left text-sm font-medium">考试科目</th>
              <th className="px-4 py-3 text-left text-sm font-medium">难度/重要度</th>
              <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading || isFilterLoading ? (
              <tr>
                <td className="px-4 py-3 text-sm" colSpan={6}>
                  加载中...
                </td>
              </tr>
            ) : currentPageItems.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-sm" colSpan={6}>
                  没有找到匹配的知识点
                </td>
              </tr>
            ) : (
              currentPageItems.map((point, index) => (
                <tr key={point.id}>
                  <td className="px-4 py-3 text-sm">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {point.title}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {point.disciplineName}<br/>
                    <span className="text-xs text-muted-foreground">{point.chapterName}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">{point.subjectName}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-xs">难度: <span className="text-yellow-500">{renderStars(point.difficulty)}</span></span>
                      <span className="text-xs">重要: <span className="text-red-500">{renderStars(point.importance)}</span></span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/knowledge-points/${point.id}/edit`}
                        className="text-blue-600 hover:underline"
                      >
                        编辑
                      </Link>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => handleDelete(point.id)}
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