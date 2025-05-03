/**
 * @description 知识点管理页面
 * @author 郝桃桃
 * @date 2024-05-23
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

interface KnowledgePoint {
  id: number;
  title: string;
  content: string;
  chapterId: number;
  chapterName: string;
  disciplineId: number;
  disciplineName: string;
  subjectId: number;
  subjectName: string;
  difficulty: number;
  importance: number;
}

interface NursingDiscipline {
  id: number;
  name: string;
}

interface Chapter {
  id: number;
  name: string;
  disciplineId: number;
}

interface ExamSubject {
  id: number;
  name: string;
}

export default function KnowledgePointsPage() {
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [disciplines, setDisciplines] = useState<NursingDiscipline[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // 获取所有护理学科和考试科目
  useEffect(() => {
    // 这里模拟从API获取数据
    // 实际项目中应该使用fetch调用后端API
    setTimeout(() => {
      setDisciplines([
        { id: 1, name: "内科护理" },
        { id: 2, name: "外科护理" },
        { id: 3, name: "妇产科护理" },
        { id: 4, name: "儿科护理" },
        { id: 5, name: "急救护理" },
        { id: 6, name: "社区护理" },
      ]);

      setSubjects([
        { id: 1, name: "专业知识" },
        { id: 2, name: "专业实践能力" },
        { id: 3, name: "现场论文答辩" },
        { id: 4, name: "外语水平" },
      ]);

      setIsLoading(false);
    }, 300);
  }, []);

  // 基于选择的学科获取章节
  useEffect(() => {
    if (!selectedDiscipline) {
      setChapters([]);
      setSelectedChapter("");
      return;
    }

    setIsLoading(true);
    // 这里模拟获取章节数据
    setTimeout(() => {
      const disciplineId = parseInt(selectedDiscipline);
      const chapterCount = disciplineId === 1 ? 6 : disciplineId === 2 ? 5 : 4;
      const chapterData: Chapter[] = [];
      
      for (let i = 1; i <= chapterCount; i++) {
        chapterData.push({
          id: (disciplineId - 1) * 10 + i,
          name: `第${i}章 ${getDisciplineName(disciplineId)}的基本概念和理论`,
          disciplineId,
        });
      }
      
      setChapters(chapterData);
      setIsLoading(false);
    }, 300);
  }, [selectedDiscipline]);

  // 基于选择的学科、章节和科目获取知识点
  useEffect(() => {
    // 如果没有选择值，不加载知识点
    if (!selectedDiscipline && !selectedChapter && !selectedSubject && !searchTerm) {
      setKnowledgePoints([]);
      return;
    }

    setIsLoading(true);
    // 模拟从API获取知识点数据
    setTimeout(() => {
      const points: KnowledgePoint[] = [];
      const limit = 20; // 最多显示20条数据
      
      // 生成模拟数据
      for (let i = 1; i <= limit; i++) {
        const disciplineId = selectedDiscipline ? parseInt(selectedDiscipline) : Math.floor(Math.random() * 6) + 1;
        const chapterId = selectedChapter ? parseInt(selectedChapter) : (disciplineId - 1) * 10 + Math.floor(Math.random() * 4) + 1;
        const subjectId = selectedSubject ? parseInt(selectedSubject) : Math.floor(Math.random() * 4) + 1;
        
        const point: KnowledgePoint = {
          id: i,
          title: `知识点${i}: ${getDisciplineName(disciplineId)}中的重要概念`,
          content: `这是关于${getDisciplineName(disciplineId)}的重要知识点，包含相关理论和实践应用`,
          chapterId,
          chapterName: `第${chapterId % 10}章 基础概念`,
          disciplineId,
          disciplineName: getDisciplineName(disciplineId),
          subjectId,
          subjectName: getSubjectName(subjectId),
          difficulty: Math.floor(Math.random() * 5) + 1,
          importance: Math.floor(Math.random() * 5) + 1,
        };
        
        // 如果设置了搜索条件，只添加匹配的知识点
        if (searchTerm && !point.title.includes(searchTerm) && !point.content.includes(searchTerm)) {
          continue;
        }
        
        points.push(point);
      }
      
      setKnowledgePoints(points);
      setIsLoading(false);
    }, 500);
  }, [selectedDiscipline, selectedChapter, selectedSubject, searchTerm]);

  // 获取学科名称
  function getDisciplineName(id: number): string {
    const discipline = disciplines.find(d => d.id === id);
    return discipline ? discipline.name : "";
  }

  // 获取科目名称
  function getSubjectName(id: number): string {
    const subject = subjects.find(s => s.id === id);
    return subject ? subject.name : "";
  }

  // 处理搜索
  function handleSearch() {
    // 搜索功能的useEffect依赖会自动触发搜索
  }

  // 重置所有筛选条件
  function resetFilters() {
    setSelectedDiscipline("");
    setSelectedChapter("");
    setSelectedSubject("");
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
              <SelectItem value="">全部学科</SelectItem>
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
            disabled={isLoading || !selectedDiscipline || chapters.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择章节" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部章节</SelectItem>
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
              <SelectItem value="">全部科目</SelectItem>
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
                  {selectedDiscipline || selectedChapter || selectedSubject || searchTerm
                    ? "没有找到匹配的知识点"
                    : "请选择筛选条件或添加知识点"}
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
                      <Link
                        href={`/admin/knowledge-points/${point.id}/delete`}
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