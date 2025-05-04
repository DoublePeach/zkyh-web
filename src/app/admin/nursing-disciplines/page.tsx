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
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    if (!confirm("确定要删除此护理学科吗？此操作不可恢复，且需要先删除与其关联的所有章节。")) {
      return;
    }

    setIsDeleting(true);
    try {
      console.log(`尝试删除护理学科 ID=${id}`);
      const response = await deleteNursingDiscipline(id);
      console.log('删除护理学科响应:', response);
      
      if (response.success) {
        toast.success("护理学科删除成功");
        // 重新加载数据
        loadDisciplines();
      } else {
        toast.error("删除失败: " + (response.error || response.message || "未知错误"));
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

      {isLoading ? (
        <div className="text-center py-6">加载中...</div>
      ) : disciplines.length === 0 ? (
        <div className="text-center py-6">暂无学科数据，请添加</div>
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
              <CardContent>
                <p className="text-sm">{discipline.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link
                  href={`/admin/nursing-disciplines/${discipline.id}/edit`}
                >
                  <Button variant="outline" size="sm">编辑</Button>
                </Link>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDelete(discipline.id)}
                  disabled={isDeleting}
                >
                  删除
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 