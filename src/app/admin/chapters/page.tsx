/**
 * @description 章节管理页面
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

interface Chapter {
  id: number;
  name: string;
  description: string;
  disciplineId: number;
  orderIndex: number;
}

interface NursingDiscipline {
  id: number;
  name: string;
}

export default function ChaptersPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [disciplines, setDisciplines] = useState<NursingDiscipline[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // 获取所有护理学科
  useEffect(() => {
    // 这里模拟从API获取学科数据
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
      setIsLoading(false);
    }, 300);
  }, []);

  // 基于选择的学科获取章节数据
  useEffect(() => {
    if (!selectedDiscipline) return;

    setIsLoading(true);
    // 这里模拟从API获取章节数据
    // 实际项目中应该使用fetch调用后端API
    setTimeout(() => {
      // 根据选择的学科生成模拟数据
      const disciplineId = parseInt(selectedDiscipline);
      const chapterData: Chapter[] = [];
      
      // 为每个学科生成4-6个章节
      const chapterCount = disciplineId === 1 ? 6 : disciplineId === 2 ? 5 : 4;
      
      for (let i = 1; i <= chapterCount; i++) {
        chapterData.push({
          id: (disciplineId - 1) * 10 + i,
          name: `第${i}章 ${getDisciplineName(disciplineId)}的基本概念和理论`,
          description: `${getDisciplineName(disciplineId)}的第${i}章内容，包括基础知识和相关理论`,
          disciplineId,
          orderIndex: i,
        });
      }
      
      setChapters(chapterData);
      setIsLoading(false);
    }, 500);
  }, [selectedDiscipline]);

  // 获取学科名称
  function getDisciplineName(id: number): string {
    const discipline = disciplines.find(d => d.id === id);
    return discipline ? discipline.name : "";
  }

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
          disabled={isLoading || disciplines.length === 0}
        >
          <SelectTrigger id="discipline-select" className="w-[300px]">
            <SelectValue placeholder="请选择护理学科" />
          </SelectTrigger>
          <SelectContent>
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
              <th className="px-4 py-3 text-left text-sm font-medium">顺序</th>
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
            ) : !selectedDiscipline ? (
              <tr>
                <td className="px-4 py-3 text-sm" colSpan={5}>
                  请先选择护理学科
                </td>
              </tr>
            ) : chapters.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-sm" colSpan={5}>
                  暂无章节数据，请添加
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
                      <Link
                        href={`/admin/chapters/${chapter.id}/delete`}
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