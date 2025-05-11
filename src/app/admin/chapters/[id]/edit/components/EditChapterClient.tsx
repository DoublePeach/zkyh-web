"use client";

/**
 * @description 编辑章节客户端组件
 * @author 郝桃桃
 * @date 2024-05-27
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// import Link from "next/link"; // Unused
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getChapter, updateChapter, ChapterRequest } from "@/lib/services/chapter-service";
import { getAllNursingDisciplines, NursingDiscipline } from "@/lib/services/nursing-discipline-service";

// 表单验证Schema
const formSchema = z.object({
  disciplineId: z.string().min(1, "请选择护理学科"),
  name: z.string().min(1, "章节名称不能为空"),
  description: z.string().min(1, "章节描述不能为空"),
  orderIndex: z.coerce.number().int().min(1, "章节顺序必须大于0"),
});

type FormData = z.infer<typeof formSchema>;

interface EditChapterClientProps {
    id: string;
}

export default function EditChapterClient({ id }: EditChapterClientProps) {
  const router = useRouter();
  const [disciplines, setDisciplines] = useState<NursingDiscipline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      disciplineId: "",
      name: "",
      description: "",
      orderIndex: 1,
    },
  });

  // 获取所有护理学科和章节数据
  useEffect(() => {
    async function loadData() {
        setIsLoading(true);
      try {
        // Load disciplines and chapter details concurrently
        const [disciplinesResponse, chapterResponse] = await Promise.all([
            getAllNursingDisciplines(),
            getChapter(parseInt(id)) // Assume id is valid for now, validation below
        ]);

        // Check disciplines
        if (!disciplinesResponse.success || !disciplinesResponse.data) {
          toast.error("获取护理学科失败: " + (disciplinesResponse.error || "未知错误"));
          // Don't push router here, let chapter check handle missing data
          setDisciplines([]); 
        } else {
            setDisciplines(disciplinesResponse.data);
        }
        
        // Check chapter details
        const chapterId = parseInt(id);
        if (isNaN(chapterId)) {
          toast.error("无效的章节ID");
          router.push("/admin/chapters");
          return;
        }
        if (!chapterResponse.success || !chapterResponse.data) {
          toast.error("获取章节详情失败: " + (chapterResponse.error || "未知错误"));
          router.push("/admin/chapters");
          return;
        }

        // Reset form with fetched data
        const chapter = chapterResponse.data;
        form.reset({
          disciplineId: chapter.disciplineId.toString(),
          name: chapter.name,
          description: chapter.description,
          orderIndex: chapter.orderIndex,
        });
      } catch (error) {
        console.error("加载数据失败:", error);
        toast.error("加载数据失败");
        router.push("/admin/chapters");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id, router, form]);

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      const chapterId = parseInt(id);
      if (isNaN(chapterId)) {
        toast.error("无效的章节ID");
        setIsSubmitting(false);
        return;
      }

      // 创建章节请求对象
      const chapterData: ChapterRequest = {
        disciplineId: parseInt(data.disciplineId),
        name: data.name,
        description: data.description,
        orderIndex: data.orderIndex
      };
      
      const response = await updateChapter(chapterId, chapterData);
      
      if (response.success) {
        toast.success("章节更新成功");
        router.push("/admin/chapters");
        router.refresh();
      } else {
        toast.error("更新失败: " + (response.error || response.message || "未知错误"));
      }
    } catch (error) {
      console.error("提交失败:", error);
      toast.error("更新失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-muted-foreground">正在加载章节信息...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header removed - belongs in server component page */}
      <Card>
        <CardHeader>
          <CardTitle>章节信息</CardTitle>
          <CardDescription>
            编辑护理学科章节
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="disciplineId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>所属护理学科</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading} // Disable while loading initial data
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择护理学科" />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderIndex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>章节顺序</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 1)} // Ensure value is number
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>章节名称</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="如：第1章 内科护理基本概念和理论" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>章节描述</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="章节的详细描述和内容概要" 
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/chapters")}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? "保存中..." : "保存更改"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 