"use client";

/**
 * @description 编辑题库客户端组件
 * @author 郝桃桃
 * @date 2024-05-27
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// import Link from "next/link"; // Unused
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// import { ArrowLeft } from "lucide-react"; // Unused

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getTestBank, updateTestBank, TestBankRequest, TestBank } from "@/lib/services/test-bank-service";
import { toast } from "sonner";

// 表单验证Schema
const formSchema = z.object({
  name: z.string().min(1, "题库名称不能为空"),
  description: z.string().min(1, "题库描述不能为空"),
  type: z.string().min(1, "请选择题库类型"),
  year: z.string().optional().nullable(), // Allow null for non-"历年真题"
  subjectId: z.string().min(1, "请选择考试科目"),
});

// 表单类型
type FormValues = z.infer<typeof formSchema>;

interface EditTestBankClientProps {
    id: string;
}

export default function EditTestBankClient({ id }: EditTestBankClientProps) {
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [testBank, setTestBank] = useState<TestBank | null>(null);
  const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // 题库类型
  const bankTypes = [
    { id: "模拟题", name: "模拟题" },
    { id: "历年真题", name: "历年真题" },
    { id: "练习题", name: "练习题" },
  ];

  // 获取题库数据和考试科目
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Get subjects first
        const response = await fetch('/api/admin/exam-subjects');
        const result = await response.json();
        if (result.success) {
          setSubjects(result.data || []); // Handle case where data might be null
        } else {
          toast.error("获取考试科目失败", {
            description: result.message,
          });
           setSubjects([]); // Set empty on failure
        }

        // Then get test bank details
        const bankId = parseInt(id);
        if (isNaN(bankId)) {
          toast.error("无效的题库ID");
          router.push("/admin/test-banks");
          return;
        }
        const testBankResult = await getTestBank(bankId);
        if (!testBankResult.success) {
          toast.error("获取题库失败", {
            description: testBankResult.message,
          });
          router.push("/admin/test-banks");
          return;
        }
        
        setTestBank(testBankResult.data || null);

      } catch (error) {
        console.error("获取数据出错:", error);
        toast.error("出错了", {
          description: "获取数据时发生错误",
        });
        router.push("/admin/test-banks");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id, router]); // Removed form from dependency here, reset is in separate effect

  // 初始化表单
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "",
      year: "",
      subjectId: "",
    },
  });

  // 题库数据加载后，设置表单默认值
  useEffect(() => {
    if (testBank) {
      form.reset({
        name: testBank.name || "",
        description: testBank.description || "",
        type: testBank.type || "",
        year: testBank.year ? testBank.year.toString() : "",
        subjectId: testBank.subjectId?.toString() || "",
      });
    }
  }, [testBank, form]); // Keep form dependency for reset

  // 监听题库类型变化
  const watchType = form.watch("type");

  // 编辑题库表单提交
  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const bankId = parseInt(id);
      if (isNaN(bankId)) {
         toast.error("无效的题库ID");
         setIsSubmitting(false);
         return;
      }
      if (!testBank) { // Should not happen if loaded correctly
         toast.error("无法更新：未找到原始题库数据");
         setIsSubmitting(false);
         return;
      }

      // 准备请求数据
      const testBankData: TestBankRequest = {
        name: values.name,
        description: values.description,
        type: values.type,
        subjectId: parseInt(values.subjectId),
      };

      // 仅对历年真题设置年份，其他类型或空字符串设为null
      if (values.type === "历年真题" && values.year && values.year.trim() !== "") {
        const parsedYear = parseInt(values.year);
        testBankData.year = isNaN(parsedYear) ? null : parsedYear;
      } else {
        testBankData.year = null;
      }

      // 发送更新请求
      const result = await updateTestBank(bankId, testBankData);

      if (result.success) {
        toast.success("更新成功", {
          description: "题库已成功更新",
        });
        router.push("/admin/test-banks");
        router.refresh(); // Refresh list page
      } else {
        toast.error("更新失败", {
          description: result.message || "未能更新题库",
        });
      }
    } catch (error: unknown) {
      console.error("更新题库失败:", error);
      const message = error instanceof Error ? error.message : "未知错误";
      toast.error("提交错误", {
        description: message || "更新题库时出现错误，请稍后重试",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show loading indicator until both subjects and test bank details are loaded
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-muted-foreground">正在加载题库数据...</p>
      </div>
    );
  }

   if (!testBank && !isLoading) { // Handle case where loading finished but testBank is still null
     return (
      <div className="flex justify-center items-center py-20">
        <p className="text-red-600">无法加载题库详情，请返回重试。</p>
      </div>
    );
   }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header is removed */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>考试科目</FormLabel>
                  <Select
                    // Key added to force re-render when default value changes
                    key={`subject-${form.formState.defaultValues?.subjectId}`}
                    disabled={isLoading || subjects.length === 0} // Disable if still loading or no subjects
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={subjects.length === 0 ? "无可用科目" : "选择考试科目"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>题库类型</FormLabel>
                  <Select
                    key={`type-${form.formState.defaultValues?.type}`}
                    disabled={isLoading} 
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择题库类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bankTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchType === "历年真题" && (
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>年份</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="请输入年份，如2024"
                        disabled={isSubmitting}
                        {...field}
                         // Handle null/undefined for input value
                        value={field.value ?? ''}
                         // Ensure onChange passes number or null
                        onChange={e => field.onChange(e.target.value ? e.target.value : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>题库名称</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="请输入题库名称"
                      disabled={isSubmitting}
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
                  <FormLabel>题库描述</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入题库描述内容"
                      className="resize-none"
                      rows={4}
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => router.push("/admin/test-banks")}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="flex-1"
              >
                {isSubmitting ? "提交中..." : "保存更改"}
              </Button>
            </div>
          </form>
        </Form>
    </div>
  );
} 