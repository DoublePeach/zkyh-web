"use client";

/**
 * @description 编辑知识点客户端组件
 * @author 郝桃桃
 * @date 2024-05-27
 */
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
  FormDescription,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  getKnowledgePoint, 
  updateKnowledgePoint, 
  KnowledgePointRequest 
} from "@/lib/services/knowledge-point-service";
import { getAllNursingDisciplines, NursingDiscipline } from "@/lib/services/nursing-discipline-service";
import { getAllChapters, Chapter } from "@/lib/services/chapter-service";
import { getAllExamSubjects, ExamSubject } from "@/lib/services/exam-subject-service";

// 表单验证Schema
const formSchema = z.object({
  title: z.string().min(1, "知识点标题不能为空"),
  content: z.string().min(1, "知识点内容不能为空"),
  disciplineId: z.string().min(1, "请选择护理学科"),
  chapterId: z.string().min(1, "请选择章节"),
  subjectId: z.string().min(1, "请选择考试科目"),
  difficulty: z.coerce.number().min(1).max(5),
  importance: z.coerce.number().min(1).max(5),
  keywords: z.string().optional(),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditKnowledgePointClientProps {
    id: string;
}

export default function EditKnowledgePointClient({ id }: EditKnowledgePointClientProps) {
  const router = useRouter();
  const [disciplines, setDisciplines] = useState<NursingDiscipline[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      disciplineId: "",
      chapterId: "",
      subjectId: "",
      difficulty: 3,
      importance: 3,
      keywords: "",
      tags: "",
    },
  });

  // 加载知识点详情和主数据
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const knowledgePointId = parseInt(id);
        if (isNaN(knowledgePointId)) {
          toast.error("无效的知识点ID");
          router.push("/admin/knowledge-points");
          return;
        }

        // Fetch all data concurrently
        const [disciplinesResponse, subjectsResponse, response] = await Promise.all([
            getAllNursingDisciplines(),
            getAllExamSubjects(),
            getKnowledgePoint(knowledgePointId)
        ]);

        // Check disciplines
        if (!disciplinesResponse.success || !disciplinesResponse.data) {
          toast.error("获取护理学科失败: " + (disciplinesResponse.error || "未知错误"));
          // Continue loading other data even if this fails?
        } else {
            setDisciplines(disciplinesResponse.data);
        }
        
        // Check subjects
        if (!subjectsResponse.success || !subjectsResponse.data) {
          toast.error("获取考试科目失败: " + (subjectsResponse.error || "未知错误"));
        } else {
            setSubjects(subjectsResponse.data);
        }

        // Check knowledge point details
        if (!response.success || !response.data) {
          toast.error("获取知识点详情失败: " + (response.error || "未知错误"));
          router.push("/admin/knowledge-points");
          return;
        }

        const knowledgePoint = response.data;

        // Load chapters based on the fetched knowledge point's discipline
        if (knowledgePoint.disciplineId) {
            const chaptersResponse = await getAllChapters(knowledgePoint.disciplineId);
            if (chaptersResponse.success && chaptersResponse.data) {
              setChapters(chaptersResponse.data);
            }
            // Don't toast error here, might be expected if discipline has no chapters yet
        }

        // 格式化关键词和标签
        const keywordsString = knowledgePoint.keywords ? knowledgePoint.keywords.join(',') : '';
        const tagsString = knowledgePoint.tags ? formatTags(knowledgePoint.tags) : '';

        // 设置表单默认值
        form.reset({
          title: knowledgePoint.title,
          content: knowledgePoint.content,
          disciplineId: knowledgePoint.disciplineId?.toString() || "",
          chapterId: knowledgePoint.chapterId.toString(),
          subjectId: knowledgePoint.subjectId.toString(),
          difficulty: knowledgePoint.difficulty,
          importance: knowledgePoint.importance,
          keywords: keywordsString,
          tags: tagsString,
        });
      } catch (error) {
        console.error("加载数据失败:", error);
        toast.error("加载数据失败");
        router.push("/admin/knowledge-points");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id, router, form]); // Keep form in dependency for reset

  // Based on selected discipline, fetch chapters
  const watchDisciplineId = form.watch("disciplineId");
  useEffect(() => {
    if (!watchDisciplineId || watchDisciplineId === "") {
        setChapters([]); // Clear chapters if no discipline selected
        // Optionally reset chapterId field if discipline is cleared
        // const currentChapter = form.getValues("chapterId");
        // if (currentChapter !== "") {
        //     form.setValue("chapterId", "");
        // }
        return;
    }

    // Avoid fetching if initial data is still loading (unless disciplineId changed)
    // This check might need refinement depending on exact loading flow
    // if (isLoading && form.formState.defaultValues?.disciplineId === watchDisciplineId) {
    //     return;
    // }

    let isMounted = true;
    setIsLoadingChapters(true);
    
    async function loadChapters() {
      try {
        const discId = parseInt(watchDisciplineId);
        if (isNaN(discId)) return; // Should not happen if select value is correct

        const chaptersResponse = await getAllChapters(discId);
        
        if(isMounted){
            if (chaptersResponse.success && chaptersResponse.data) {
              setChapters(chaptersResponse.data);
              
              // Reset chapter selection if current selection is not in the new list
              const currentChapterId = form.getValues("chapterId");
              if (currentChapterId && !chaptersResponse.data.some(c => c.id.toString() === currentChapterId)) {
                  form.setValue("chapterId", ""); 
              }
            } else {
              toast.error("获取章节失败: " + (chaptersResponse.error || "未知错误"));
              setChapters([]); // Clear on error
              form.setValue("chapterId", ""); // Reset chapter selection
            }
        }
      } catch (error) {
        console.error("获取章节失败:", error);
        if(isMounted) toast.error("获取章节失败");
        if(isMounted) setChapters([]); // Clear on error
        if(isMounted) form.setValue("chapterId", ""); // Reset chapter selection
      } finally {
        if(isMounted) setIsLoadingChapters(false);
      }
    }

    loadChapters();
    return () => { isMounted = false; };

  }, [watchDisciplineId, form]); // Depend on watched value and form

  // 将JSON对象格式化为字符串
  function formatTags(tags: Record<string, any>): string {
    if (!tags || Object.keys(tags).length === 0) return '';
    
    return Object.entries(tags)
      .map(([key, value]) => `"${key}": ${typeof value === 'string' ? `"${value}"` : JSON.stringify(value)}`) // Ensure values are stringified if not string
      .join(', ');
  }

  // Parse tags string back to object
  function parseTags(tagsString: string | undefined): Record<string, any> | undefined {
      if (!tagsString || tagsString.trim() === '') return undefined;
      try {
          // Need to wrap the string in {} to make it valid JSON
          return JSON.parse(`{${tagsString}}`);
      } catch (e) {
          console.error("Failed to parse tags JSON string:", e);
          toast.error("标签格式错误", { description: "请输入有效的 JSON key-value 对，例如 \"type\": \"理论\""});
          return undefined; // Indicate parsing failure
      }
  }

  async function onSubmit(data: FormData) {
    const parsedTags = parseTags(data.tags);
    if (data.tags && !parsedTags) { // Check if tags were provided but failed to parse
        toast.error("提交失败", { description: "请修正标签字段中的 JSON 格式错误。"});
        setActiveTab("meta"); // Switch to the tab with the error
        return; // Prevent submission
    }

    setIsSubmitting(true);
    try {
      const knowledgePointId = parseInt(id);
      if (isNaN(knowledgePointId)) {
        toast.error("无效的知识点ID");
        setIsSubmitting(false);
        return;
      }

      // 格式化数据
      const formattedData: KnowledgePointRequest = {
        // disciplineId is derived from chapterId on the backend, not sent directly?
        // Check if your service/API expects disciplineId
        chapterId: parseInt(data.chapterId),
        subjectId: parseInt(data.subjectId),
        title: data.title,
        content: data.content,
        difficulty: data.difficulty, // Already number due to coerce
        importance: data.importance, // Already number due to coerce
        keywords: data.keywords ? data.keywords.split(',').map(k => k.trim()).filter(k => k !== '') : [], // Ensure empty strings are filtered
        tags: parsedTags, // Use parsed object
      };
      
      const response = await updateKnowledgePoint(knowledgePointId, formattedData);
      
      if (response.success) {
        toast.success("知识点更新成功");
        router.push("/admin/knowledge-points");
        router.refresh();
      } else {
        toast.error("更新失败: " + (response.error || response.message || "未知错误"));
      }
    } catch (error: any) {
      console.error("提交失败:", error);
      toast.error("更新失败，请重试", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-muted-foreground">正在加载知识点信息...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header removed */}
      <Card>
        <CardHeader>
          <CardTitle>知识点信息</CardTitle>
          <CardDescription>
            编辑护理学科知识点
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="basic">基本信息</TabsTrigger>
                  <TabsTrigger value="content">知识点内容</TabsTrigger>
                  <TabsTrigger value="meta">元数据设置</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  {/* Basic Info Form */}
                  <div className="grid gap-4 grid-cols-2">
                    <FormField
                      control={form.control}
                      name="disciplineId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>所属护理学科</FormLabel>
                          <Select
                            onValueChange={(value) => {
                                field.onChange(value); 
                                // Reset chapter when discipline changes
                                form.setValue('chapterId', ''); 
                                setChapters([]); // Clear chapter options immediately
                            }}
                            value={field.value}
                            disabled={isLoading}
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
                      name="chapterId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>所属章节</FormLabel>
                          <Select
                            disabled={isLoadingChapters || !watchDisciplineId || chapters.length === 0}
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={!watchDisciplineId ? "请先选学科" : (isLoadingChapters ? "加载中..." : "选择章节")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="subjectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>所属考试科目</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择考试科目" />
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
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>知识点标题</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="输入知识点标题，简明扼要地概括知识点"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setActiveTab("content")}
                      disabled={isSubmitting}
                    >
                      下一步：填写内容
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="content" className="space-y-4">
                  {/* Knowledge Point Content Form */}
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>知识点内容</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="详细描述知识点内容，可包含定义、解释、应用场景等"
                            rows={15}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-2 flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("basic")}
                      disabled={isSubmitting}
                    >
                      返回基本信息
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setActiveTab("meta")}
                      disabled={isSubmitting}
                    >
                      下一步：设置元数据
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="meta" className="space-y-4">
                  {/* Metadata Form */}
                  <div className="grid gap-6 grid-cols-2">
                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            难度级别: {field.value || '未设置'} {/* Show something if default is used*/}
                          </FormLabel>
                          <FormControl>
                            <Slider
                              min={1}
                              max={5}
                              step={1}
                              defaultValue={[field.value || 3]} // Default slider position
                              value={[field.value || 3]} // Control slider value
                              onValueChange={(vals: number[]) => field.onChange(vals[0])}
                              className="pt-2"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            1(简单) - 5(困难)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="importance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            重要程度: {field.value || '未设置'}
                          </FormLabel>
                          <FormControl>
                            <Slider
                              min={1}
                              max={5}
                              step={1}
                              defaultValue={[field.value || 3]}
                              value={[field.value || 3]}
                              onValueChange={(vals: number[]) => field.onChange(vals[0])}
                              className="pt-2"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            1(一般) - 5(核心)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="keywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>关键词</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="输入关键词，用英文逗号分隔"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          例如：心血管,护理评估,高血压
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>标签 (JSON格式)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='输入JSON格式，如："type": "理论", "level": "初级"'
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          JSON格式，无需包含外层括号，直接输入key-value对
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4 flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("content")}
                      disabled={isSubmitting}
                    >
                      返回内容编辑
                    </Button>
                    <div className="space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/admin/knowledge-points")}
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
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 