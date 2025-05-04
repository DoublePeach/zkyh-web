/**
 * @description 护理学科管理页面
 * @author 郝桃桃
 * @date 2024-05-23
 */
"use client";

import Link from "next/link";
import Image from 'next/image';
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  getAllNursingDisciplines, 
  deleteNursingDiscipline, 
  NursingDiscipline 
} from "@/lib/services/nursing-discipline-service";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function NursingDisciplinesPage() {
  const [disciplines, setDisciplines] = useState<NursingDiscipline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // 加载护理学科数据
  const loadDisciplines = async () => {
    setIsLoading(true);
    try {
      const response = await getAllNursingDisciplines();
      if (response.success && response.data) {
        setDisciplines(response.data);
      } else {
        toast.error("获取护理学科失败: " + (response.error || "未知错误"));
      }
    } catch (error) {
      console.error("获取护理学科出错:", error);
      toast.error("获取护理学科失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadDisciplines();
  }, []);

  // 删除护理学科
  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除此护理学科吗？此操作不可恢复，且会删除与其关联的所有章节和知识点。")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await deleteNursingDiscipline(id);
      if (response.success) {
        toast.success("护理学科删除成功");
        // 重新加载数据
        loadDisciplines();
      } else {
        toast.error("删除护理学科失败: " + (response.error || "未知错误"));
      }
    } catch (error) {
      console.error("删除护理学科出错:", error);
      toast.error("删除护理学科失败");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">护理学科管理</h1>
          <p className="text-muted-foreground">
            管理护理职称考试的学科
          </p>
        </div>
        <Link
          href="/admin/nursing-disciplines/new"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          添加学科
        </Link>
      </div>

      <div className="rounded-md border">
        <table className="w-full divide-y divide-border">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium">学科名称</th>
              <th className="px-4 py-3 text-left text-sm font-medium">描述</th>
              <th className="px-4 py-3 text-left text-sm font-medium">图标</th>
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
            ) : disciplines.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-sm" colSpan={5}>
                  暂无学科数据，请添加
                </td>
              </tr>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {disciplines.map((discipline) => (
                  <Card key={discipline.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {discipline.name}
                      </CardTitle>
                      {discipline.imageUrl && (
                        <div className="relative h-8 w-8 text-muted-foreground">
                          <Image 
                            src={discipline.imageUrl} 
                            alt={`${discipline.name} 图标`} 
                            fill
                            style={{objectFit:"contain"}}
                            sizes="32px"
                          />
                        </div>
                      )}
                    </CardHeader>
                    <div className="px-4 py-3 text-sm">
                      {discipline.description}
                    </div>
                    <div className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/nursing-disciplines/${discipline.id}/edit`}
                          className="text-blue-600 hover:underline"
                        >
                          编辑
                        </Link>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleDelete(discipline.id)}
                          disabled={isDeleting}
                          className="text-red-600 hover:underline disabled:opacity-50"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 