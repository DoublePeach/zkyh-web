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
import { getAllTestBanks, TestBank, deleteTestBank } from "@/lib/services/test-bank-service";
import { toast } from "sonner";

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
    async function fetchExamSubjects() {
      try {
        const response = await fetch('/api/admin/exam-subjects');
        const result = await response.json();
        
        if (result.success) {
          setSubjects(result.data);
        } else {
          toast.error("获取考试科目失败", {
            description: result.message,
          });
        }
      } catch (error) {
        console.error("获取考试科目出错:", error);
        toast.error("出错了", {
          description: "获取考试科目时发生错误",
        });
      }
    }

    fetchExamSubjects();
  }, []);

  // 基于选择的科目和类型获取题库
  useEffect(() => {
    let isMounted = true; // Prevent state update on unmounted component
    
    async function fetchTestBanks() {
      // Always set loading to true when fetching
      setIsLoading(true); 
      
      try {
        // Build API URL conditionally
        let apiUrl = '/api/admin/test-banks';
        const queryParams = new URLSearchParams();
        if (selectedSubject !== "all") {
          queryParams.append('subjectId', selectedSubject);
        }
        if (selectedType !== "all") {
          queryParams.append('type', selectedType);
        }
        const queryString = queryParams.toString();
        if (queryString) {
          apiUrl += `?${queryString}`;
        }

        console.log(`Fetching test banks from: ${apiUrl}`); // Log the API URL

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        
        if (isMounted) { // Check if component is still mounted
            if (result.success) {
              setTestBanks(result.data || []);
            } else {
              toast.error("获取题库失败", {
                description: result.message || '未知错误',
              });
              setTestBanks([]); // Clear data on error
            }
        }
      } catch (error: unknown) {
        console.error("获取题库出错:", error);
         if (isMounted) {
            const message = error instanceof Error ? error.message : "未知错误";
            toast.error("出错了", {
              description: message || "获取题库时发生错误",
            });
            setTestBanks([]); // Clear data on error
         }
      } finally {
         if (isMounted) {
             setIsLoading(false);
         }
      }
    }

    fetchTestBanks();

    // Cleanup function
    return () => {
        isMounted = false;
    };
    
  // Re-run whenever filters change
  }, [selectedSubject, selectedType]);

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

  async function handleDeleteTestBank(bank: TestBank) {
    if (window.confirm(`确定要删除"${bank.name}"题库吗？`)) {
      try {
        const result = await deleteTestBank(bank.id);
        
        if (result.success) {
          toast.success("删除成功", {
            description: "题库已成功删除",
          });
          // 刷新列表
          const options: { subjectId?: number; type?: string } = {};
          
          if (selectedSubject !== "all") {
            options.subjectId = parseInt(selectedSubject);
          }
          
          if (selectedType !== "all") {
            options.type = selectedType;
          }
          
          const refreshResult = await getAllTestBanks(options);
          if (refreshResult.success) {
            setTestBanks(refreshResult.data || []);
          }
        } else {
          toast.error("删除失败", {
            description: result.message || "未能删除题库",
          });
        }
      } catch (error) {
        console.error("删除题库失败:", error);
        toast.error("删除出错", {
          description: "删除题库时出现错误，请稍后重试",
        });
      }
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
                  <button
                    onClick={() => handleDeleteTestBank(bank)}
                    className="text-red-600 hover:underline"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 