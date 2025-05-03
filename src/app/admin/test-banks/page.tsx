/**
 * @description 题库管理页面
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FilterX } from "lucide-react";

interface TestBank {
  id: number;
  name: string;
  description: string;
  type: string;
  year: number | null;
  subjectId: number;
  subjectName: string;
  totalQuestions: number;
}

interface ExamSubject {
  id: number;
  name: string;
}

export default function TestBanksPage() {
  const [testBanks, setTestBanks] = useState<TestBank[]>([]);
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  // 题库类型
  const bankTypes = [
    { id: "模拟题", name: "模拟题" },
    { id: "历年真题", name: "历年真题" },
    { id: "练习题", name: "练习题" },
  ];

  // 获取所有考试科目
  useEffect(() => {
    // 这里模拟从API获取数据
    // 实际项目中应该使用fetch调用后端API
    setTimeout(() => {
      setSubjects([
        { id: 1, name: "专业知识" },
        { id: 2, name: "专业实践能力" },
        { id: 3, name: "现场论文答辩" },
        { id: 4, name: "外语水平" },
      ]);
      setIsLoading(false);
    }, 300);
  }, []);

  // 基于选择的科目和类型获取题库
  useEffect(() => {
    // 如果没有选择值且第一次加载，不加载题库
    if ((selectedSubject === "all" && selectedType === "all") && isLoading) {
      return;
    }

    setIsLoading(true);
    // 模拟从API获取题库数据
    setTimeout(() => {
      const banks: TestBank[] = [];
      
      // 生成模拟数据 - 每个科目每种类型生成2-3个题库
      for (let subjectId = 1; subjectId <= 4; subjectId++) {
        const types = ["模拟题", "历年真题", "练习题"];
        
        types.forEach(type => {
          const count = type === "历年真题" ? 3 : 2;
          
          for (let i = 1; i <= count; i++) {
            const id = (subjectId - 1) * 10 + (type === "模拟题" ? i : type === "历年真题" ? i + 3 : i + 6);
            const year = type === "历年真题" ? 2024 - i : null;
            
            const bank: TestBank = {
              id,
              name: type === "历年真题" 
                ? `${year}年${getSubjectName(subjectId)}真题`
                : `${getSubjectName(subjectId)}${type} ${i}`,
              description: `${type === "历年真题" ? `${year}年` : ""}${getSubjectName(subjectId)}${type}，包含各种题型`,
              type,
              year,
              subjectId,
              subjectName: getSubjectName(subjectId),
              totalQuestions: Math.floor(Math.random() * 50) + 50, // 50-100题
            };
            
            // 仅添加符合筛选条件的题库
            if ((selectedSubject === "all" || parseInt(selectedSubject) === subjectId) && 
                (selectedType === "all" || selectedType === type)) {
              banks.push(bank);
            }
          }
        });
      }
      
      setTestBanks(banks);
      setIsLoading(false);
    }, 500);
  }, [selectedSubject, selectedType]);

  // 获取科目名称
  function getSubjectName(id: number): string {
    const subject = subjects.find(s => s.id === id);
    return subject ? subject.name : "";
  }

  // 重置所有筛选条件
  function resetFilters() {
    setSelectedSubject("all");
    setSelectedType("all");
  }

  // 获取题库类型对应的显示颜色
  function getTypeColor(type: string): string {
    switch (type) {
      case "模拟题":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "历年真题":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case "练习题":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">题库管理</h1>
          <p className="text-muted-foreground text-sm mt-1">
            管理各考试科目题库
          </p>
        </div>
        <Link
          href="/admin/test-banks/new"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> 添加题库
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">考试科目</label>
          <Select 
            value={selectedSubject} 
            onValueChange={setSelectedSubject}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择考试科目" />
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
          <label className="mb-2 block text-sm font-medium">题库类型</label>
          <Select 
            value={selectedType} 
            onValueChange={setSelectedType}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择题库类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {bankTypes.map((type) => (
                <SelectItem 
                  key={type.id} 
                  value={type.id}
                >
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={resetFilters}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          <FilterX className="mr-2 h-4 w-4" /> 重置筛选
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-10">
            <div className="text-muted-foreground">加载中...</div>
          </div>
        ) : testBanks.length === 0 ? (
          <div className="col-span-full text-center py-10">
            <div className="text-muted-foreground">
              {selectedSubject !== "all" || selectedType !== "all"
                ? "没有找到匹配的题库"
                : "请选择筛选条件或添加题库"}
            </div>
          </div>
        ) : (
          testBanks.map((bank) => (
            <div 
              key={bank.id} 
              className="rounded-lg border bg-card p-4 shadow-sm flex flex-col"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold truncate mr-2 text-sm sm:text-base">
                  {bank.name}
                </h3>
                <Badge className={getTypeColor(bank.type)}>
                  {bank.type}
                </Badge>
              </div>
              
              <div className="text-xs sm:text-sm text-muted-foreground mb-1">
                {bank.subjectName}
                {bank.year && ` • ${bank.year}年`}
              </div>
              
              <p className="text-xs sm:text-sm mb-3 flex-grow">
                {bank.description}
              </p>
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-auto">
                <div className="text-xs sm:text-sm">
                  共 <span className="font-medium">{bank.totalQuestions}</span> 题
                </div>
                <div className="flex items-center space-x-2 text-xs sm:text-sm">
                  <Link
                    href={`/admin/test-banks/${bank.id}/quiz-questions`}
                    className="text-blue-600 hover:underline"
                  >
                    管理试题
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link
                    href={`/admin/test-banks/${bank.id}/edit`}
                    className="text-blue-600 hover:underline"
                  >
                    编辑
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link
                    href={`/admin/test-banks/${bank.id}/delete`}
                    className="text-red-600 hover:underline"
                  >
                    删除
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 