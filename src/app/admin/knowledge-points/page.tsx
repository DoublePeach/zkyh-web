/**
 * @description 知识点管理页面
 * @author 郝桃桃
 * @date 2024-05-25
 */
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
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

export default function KnowledgePointsPage() {
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [disciplines, setDisciplines] = useState<NursingDiscipline[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");
  const [selectedChapter, setSelectedChapter] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // 获取所有护理学科和考试科目
  useEffect(() => {
    async function loadData() {
      try {
        // 获取护理学科
        const disciplinesResponse = await getAllNursingDisciplines();
        if (disciplinesResponse.success && disciplinesResponse.data) {
          setDisciplines(disciplinesResponse.data);
        } else {
          toast.error("获取护理学科失败: " + (disciplinesResponse.error || "未知错误"));
        }

        // 获取考试科目
        const subjectsResponse = await getAllExamSubjects();
        if (subjectsResponse.success && subjectsResponse.data) {
          setSubjects(subjectsResponse.data);
        } else {
          toast.error("获取考试科目失败: " + (subjectsResponse.error || "未知错误"));
        }
      } catch (error) {
        console.error("初始化数据失败:", error);
        toast.error("加载数据失败");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // 基于选择的学科获取章节
  useEffect(() => {
    if (selectedDiscipline === "all") {
      setChapters([]);
      setSelectedChapter("all");
      return;
    }

    setIsLoading(true);
    
    async function loadChapters() {
      try {
        const disciplineId = parseInt(selectedDiscipline);
        const chaptersResponse = await getAllChapters(disciplineId);
        
        if (chaptersResponse.success && chaptersResponse.data) {
          setChapters(chaptersResponse.data);
        } else {
          toast.error("获取章节失败: " + (chaptersResponse.error || "未知错误"));
        }
      } catch (error) {
        console.error("获取章节失败:", error);
        toast.error("获取章节失败");
      } finally {
        setIsLoading(false);
      }
    }

    loadChapters();
  }, [selectedDiscipline]);

  // 加载知识点数据
  const loadKnowledgePoints = async () => {
    setIsLoading(true);
    try {
      const options: {
        disciplineId?: number;
        chapterId?: number;
        subjectId?: number;
        search?: string;
      } = {};

      if (selectedDiscipline !== "all") {
        options.disciplineId = parseInt(selectedDiscipline);
      }

      if (selectedChapter !== "all") {
        options.chapterId = parseInt(selectedChapter);
      }

      if (selectedSubject !== "all") {
        options.subjectId = parseInt(selectedSubject);
      }

      if (searchTerm) {
        options.search = searchTerm;
      }

      const response = await getAllKnowledgePoints(options);
      
      if (response.success && response.data) {
        setKnowledgePoints(response.data);
      } else {
        toast.error("获取知识点失败: " + (response.error || "未知错误"));
      }
    } catch (error) {
      console.error("获取知识点出错:", error);
      toast.error("获取知识点失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 基于筛选条件获取知识点
  useEffect(() => {
    // 加载知识点数据
    loadKnowledgePoints();
  }, [selectedDiscipline, selectedChapter, selectedSubject, searchTerm]);

  // 处理删除知识点
  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除此知识点吗？此操作不可恢复。")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await deleteKnowledgePoint(id);
      if (response.success) {
        toast.success("知识点删除成功");
        
        // 更新知识点列表，移除已删除的知识点
        setKnowledgePoints(prevPoints => prevPoints.filter(point => point.id !== id));
      } else {
        toast.error("删除知识点失败: " + (response.error || "未知错误"));
      }
    } catch (error) {
      console.error("删除知识点出错:", error);
      toast.error("删除知识点失败");
    } finally {
      setIsDeleting(false);
    }
  };

  // 处理搜索
  function handleSearch() {
    // 搜索功能的useEffect依赖会自动触发搜索
  }

  // 重置所有筛选条件
  function resetFilters() {
    setSelectedDiscipline("all");
    setSelectedChapter("all");
    setSelectedSubject("all");
    setSearchTerm("");
  }

  // 渲染难度或重要程度的星星图标
  function renderStars(count: number) {
    return "★".repeat(count) + "☆".repeat(5 - count);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">知识点管理</h1>
          <p className="text-muted-foreground">
            管理各护理学科章节的知识点
          </p>
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
            onValueChange={setSelectedDiscipline}
            disabled={isLoading}
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
            onValueChange={setSelectedChapter}
            disabled={isLoading || selectedDiscipline === "all" || chapters.length === 0}
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
            onValueChange={setSelectedSubject}
            disabled={isLoading}
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

      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={resetFilters}
          disabled={isLoading}
        >
          重置筛选
        </Button>
      </div>

      <div className="rounded-md border">
        <table className="w-full divide-y divide-border">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium">标题</th>
              <th className="px-4 py-3 text-left text-sm font-medium">学科/章节</th>
              <th className="px-4 py-3 text-left text-sm font-medium">考试科目</th>
              <th className="px-4 py-3 text-left text-sm font-medium">难度/重要度</th>
              <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td className="px-4 py-3 text-sm" colSpan={6}>
                  加载中...
                </td>
              </tr>
            ) : knowledgePoints.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-sm" colSpan={6}>
                  没有找到匹配的知识点
                </td>
              </tr>
            ) : (
              knowledgePoints.map((point) => (
                <tr key={point.id}>
                  <td className="px-4 py-3 text-sm">{point.id}</td>
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
    </div>
  );
} 