/**
 * @description 添加章节页面
 * @author 郝桃桃
 * @date 2024-05-23
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

interface NursingDiscipline {
  id: number;
  name: string;
}

// 表单验证Schema
const formSchema = z.object({
  disciplineId: z.string().min(1, "请选择护理学科"),
  name: z.string().min(1, "章节名称不能为空"),
  description: z.string().min(1, "章节描述不能为空"),
  orderIndex: z.coerce.number().int().min(1, "章节顺序必须大于0"),
});

type FormData = z.infer<typeof formSchema>;

export default function NewChapterPage() {
  const router = useRouter();
  const [disciplines, setDisciplines] = useState<NursingDiscipline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      disciplineId: "",
      name: "",
      description: "",
      orderIndex: 1,
    },
  });

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      // 这里应该调用API将数据保存到数据库
      // 实际项目中应使用fetch发送POST请求
      console.log("提交数据:", data);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success("章节添加成功");
      router.push("/admin/chapters");
    } catch (error) {
      console.error("提交失败:", error);
      toast.error("添加失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  // 获取学科名称
  function getDisciplineName(id: string): string {
    const discipline = disciplines.find(d => d.id === parseInt(id));
    return discipline ? discipline.name : "";
  }

  // 根据选择的学科生成章节名称建议
  useEffect(() => {
    const disciplineId = form.watch("disciplineId");
    const orderIndex = form.watch("orderIndex");
    
    if (disciplineId && orderIndex) {
      const disciplineName = getDisciplineName(disciplineId);
      if (disciplineName && !form.getValues("name")) {
        form.setValue("name", `第${orderIndex}章 ${disciplineName}基本概念和理论`);
      }
    }
  }, [form.watch("disciplineId"), form.watch("orderIndex")]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">添加章节</h1>
        <Link
          href="/admin/chapters"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          返回章节列表
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>章节信息</CardTitle>
          <CardDescription>
            添加新的护理学科章节
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
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
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
                  {isSubmitting ? "保存中..." : "保存章节"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 