"use client";

/**
 * @description 新建/编辑试卷表单组件
 * @author 郝桃桃
 * @date 2024-05-27
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check, ChevronsUpDown, PlusCircle, X } from 'lucide-react';

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
  FormDescription
} from "@/components/ui/form";
import { toast } from "sonner";
import { ExamSubject } from '@/lib/services/exam-subject-service'; // Assuming type exists
import { QuizQuestion } from '@/lib/services/quiz-question-service'; // Assuming type exists
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Validation schema
const formSchema = z.object({
  title: z.string().min(1, '试卷标题不能为空'),
  description: z.string().optional().nullable(),
  subjectId: z.string().min(1, '请选择考试科目'),
  duration: z.coerce.number().int().positive('考试时长必须为正整数').optional().nullable(),
  totalScore: z.coerce.number().int().positive('总分必须为正整数').optional().nullable(),
  passingScore: z.coerce.number().int().positive('及格分数必须为正整数').optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']),
  // questionIds handled separately in component state
});

type FormValues = z.infer<typeof formSchema>;

interface ExamPaperFormProps {
  paperId?: number; // Optional: If provided, we are in edit mode
  initialData?: any; // Optional: Pre-filled data for editing
}

// Mock data/types - replace with actual API calls and types
interface SubjectOption {
    id: number;
    name: string;
}
interface QuestionOption {
    id: number;
    content: string; // Or a summary
    questionType: string;
}

async function fetchSubjects(): Promise<SubjectOption[]> {
    const res = await fetch('/api/admin/exam-subjects');
    if (!res.ok) throw new Error('Failed to fetch subjects');
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to fetch subjects');
    return result.data || [];
}

async function fetchQuestionsBySubject(subjectId: number): Promise<QuestionOption[]> {
    // TODO: Implement an API endpoint for this or fetch all and filter?
    // This might require fetching questions from test banks related to the subject.
    // For now, returning mock data.
    console.warn("fetchQuestionsBySubject needs implementation. Fetching all questions for now.");
    const res = await fetch(`/api/admin/quiz-questions?subjectId=${subjectId}`); // Placeholder API
    if (!res.ok) throw new Error('Failed to fetch questions');
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to fetch questions');
    return (result.data || []).map((q: any) => ({ id: q.id, content: q.content.substring(0, 100) + '...', questionType: q.questionType })); // Simplify content

}

async function fetchExamPaperDetail(id: number): Promise<any> {
    const res = await fetch(`/api/admin/exam-papers/${id}`);
    if (!res.ok) throw new Error('Failed to fetch paper details');
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Failed to fetch paper details');
    return result.data;
}

export default function ExamPaperForm({ paperId }: ExamPaperFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(!!paperId); // Loading if editing
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<QuestionOption[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<QuestionOption[]>([]);
  const [questionSearchTerm, setQuestionSearchTerm] = useState("");
  const [isQuestionPopoverOpen, setIsQuestionPopoverOpen] = useState(false);

  const isEditMode = !!paperId;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      subjectId: '',
      duration: undefined,
      totalScore: undefined,
      passingScore: undefined,
      status: 'draft',
    },
  });

  const selectedSubjectId = form.watch("subjectId");

  // Fetch initial data (subjects and paper details if editing)
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const subjectData = await fetchSubjects();
        setSubjects(subjectData);

        if (isEditMode && paperId) {
          const paperData = await fetchExamPaperDetail(paperId);
          form.reset({
            title: paperData.title || '',
            description: paperData.description || '',
            subjectId: paperData.subjectId?.toString() || '',
            duration: paperData.duration || undefined,
            totalScore: paperData.totalScore || undefined,
            passingScore: paperData.passingScore || undefined,
            status: paperData.status || 'draft',
          });
          // Fetch and set initial selected questions
          if (paperData.subjectId && paperData.questionIds && paperData.questionIds.length > 0) {
             const questions = await fetchQuestionsBySubject(paperData.subjectId);
             setAvailableQuestions(questions);
             const initialSelected = questions.filter(q => paperData.questionIds.includes(q.id));
             setSelectedQuestions(initialSelected);
          }
        }
      } catch (error: any) {
        console.error("Failed to load initial data:", error);
        toast.error("加载初始数据失败", { description: error.message });
        // Optionally redirect if loading fails significantly
        // router.push('/admin/exam-papers');
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, [paperId, isEditMode, form, router]);

  // Fetch available questions when subject changes
  useEffect(() => {
    if (selectedSubjectId && selectedSubjectId !== '') {
      const subjectIdNum = parseInt(selectedSubjectId);
      if (!isNaN(subjectIdNum)) {
        setIsLoading(true); // Indicate loading questions
        fetchQuestionsBySubject(subjectIdNum)
          .then(questions => {
            setAvailableQuestions(questions);
            // Reset selected questions if subject changes (optional, could try to preserve)
            // setSelectedQuestions([]); 
          })
          .catch(error => {
            console.error("Failed to fetch questions for subject:", error);
            toast.error("加载试题列表失败", { description: error.message });
            setAvailableQuestions([]);
          })
          .finally(() => setIsLoading(false));
      }
    } else {
      setAvailableQuestions([]); // Clear questions if no subject selected
      setSelectedQuestions([]); // Clear selected as well
    }
  }, [selectedSubjectId]);

  // --- Question Selection Logic ---
  const addQuestion = (question: QuestionOption) => {
    if (!selectedQuestions.some(q => q.id === question.id)) {
      setSelectedQuestions(prev => [...prev, question]);
    }
     setIsQuestionPopoverOpen(false); // Close popover after selection
  };

  const removeQuestion = (questionId: number) => {
    setSelectedQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const filteredAvailableQuestions = availableQuestions.filter(q => 
     !selectedQuestions.some(sq => sq.id === q.id) &&
     (q.content.toLowerCase().includes(questionSearchTerm.toLowerCase()) || 
      q.questionType.toLowerCase().includes(questionSearchTerm.toLowerCase()))
  );
  // --- End Question Selection Logic ---

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
        const submissionData = {
            ...values,
            subjectId: parseInt(values.subjectId), // Convert back to number
            questionIds: selectedQuestions.map(q => q.id),
            // Ensure nullable number fields are sent as null if empty/NaN
            duration: values.duration || null,
            totalScore: values.totalScore || null,
            passingScore: values.passingScore || null,
        };

      let result;
      if (isEditMode && paperId) {
        // Update existing paper
        const response = await fetch(`/api/admin/exam-papers/${paperId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submissionData),
        });
         result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || result.message || '更新试卷失败');
        }
        toast.success("更新成功", { description: "试卷已成功更新" });
      } else {
        // Create new paper
         const response = await fetch(`/api/admin/exam-papers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submissionData),
        });
        result = await response.json();
         if (!response.ok || !result.success) {
            throw new Error(result.error || result.message || '创建试卷失败');
        }
        toast.success("创建成功", { description: "试卷已成功创建" });
      }
      router.push("/admin/exam-papers"); // Redirect to list page
       router.refresh(); // Refresh server components on the list page

    } catch (error: any) {
      console.error("Failed to submit exam paper:", error);
      toast.error(isEditMode ? "更新失败" : "创建失败", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading && isEditMode) {
    return <div className="text-center py-10">加载试卷数据中...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Info Section */}
        <div className="space-y-4 p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-4">基本信息</h2>
             <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>试卷标题</FormLabel>
                    <FormControl>
                      <Input placeholder="例如：2024年度护师资格模拟考试卷一" {...field} />
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
                  <FormLabel>试卷描述 (可选)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="简要描述试卷内容、来源或注意事项"
                      rows={3}
                      {...field}
                      value={field.value ?? ''} // Handle null value
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <FormField
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>所属科目</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择考试科目" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id.toString()}>
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>状态</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择状态" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">草稿</SelectItem>
                          <SelectItem value="published">发布</SelectItem>
                          <SelectItem value="archived">归档</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
        </div>

        {/* Configuration Section */}
         <div className="space-y-4 p-6 border rounded-lg">
             <h2 className="text-lg font-semibold mb-4">试卷配置</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>考试时长 (分钟)</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="例如：120" {...field} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="totalScore"
                     render={({ field }) => (
                    <FormItem>
                        <FormLabel>总分</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="例如：100" {...field} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="passingScore"
                     render={({ field }) => (
                    <FormItem>
                        <FormLabel>及格分数</FormLabel>
                        <FormControl>
                         <Input type="number" placeholder="例如：60" {...field} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
        </div>

         {/* Question Selection Section */}
         <div className="space-y-4 p-6 border rounded-lg">
             <h2 className="text-lg font-semibold mb-2">试题选择</h2>
             <p className="text-sm text-muted-foreground mb-4">请先选择"所属科目"，然后添加试题到试卷中。</p>

            <Popover open={isQuestionPopoverOpen} onOpenChange={setIsQuestionPopoverOpen}>
                <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isQuestionPopoverOpen}
                    className="w-full justify-between"
                    disabled={!selectedSubjectId || isLoading}
                >
                    {isLoading && !selectedSubjectId ? "请先选择科目" : isLoading ? "加载试题中..." : "添加试题..."}
                    <PlusCircle className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                <Command shouldFilter={false}> {/* Disable default filtering, we do it manually */}
                    <CommandInput 
                        placeholder="搜索试题内容或类型..." 
                        value={questionSearchTerm}
                        onValueChange={setQuestionSearchTerm}
                    />
                    <CommandList>
                        <CommandEmpty>{availableQuestions.length === 0 && !isLoading ? '该科目下无可用试题' : '未找到试题'}</CommandEmpty>
                        <CommandGroup>
                             <ScrollArea className="h-72">
                                {filteredAvailableQuestions.map((question) => (
                                <CommandItem
                                    key={question.id}
                                    value={`${question.id} ${question.content} ${question.questionType}`} // Value for searching
                                    onSelect={() => addQuestion(question)}
                                >
                                    <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedQuestions.some(q => q.id === question.id) ? "opacity-100" : "opacity-0"
                                    )}
                                    />
                                    <div className="flex flex-col text-xs overflow-hidden">
                                        <span className="font-medium truncate">{question.content}</span>
                                        <span className="text-muted-foreground">{question.questionType}</span>
                                    </div>
                                </CommandItem>
                                ))}
                             </ScrollArea>
                        </CommandGroup>
                    </CommandList>
                </Command>
                </PopoverContent>
            </Popover>

            {/* Display Selected Questions */} 
            <div className="mt-4 space-y-2">
                <h3 className="text-sm font-medium">已选试题 ({selectedQuestions.length}题)</h3>
                {selectedQuestions.length === 0 ? (
                <p className="text-sm text-muted-foreground">请从上方添加试题。</p>
                ) : (
                 <ScrollArea className="h-40 border rounded-md p-2">
                    <div className="space-y-1">
                    {selectedQuestions.map(question => (
                        <div key={question.id} className="flex items-center justify-between p-1 bg-muted/50 rounded text-xs">
                           <span className="flex-1 truncate mr-2">{question.id}: {question.content}</span>
                           <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => removeQuestion(question.id)}>
                             <X className="h-3 w-3"/>
                           </Button>
                        </div>
                    ))}
                    </div>
                 </ScrollArea>
                )}
            </div>
         </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/exam-papers')} disabled={isSubmitting}>
            取消
          </Button>
          <Button type="submit" disabled={isLoading || isSubmitting}>
            {isSubmitting ? '提交中...' : (isEditMode ? '保存更改' : '创建试卷')}
          </Button>
        </div>
      </form>
    </Form>
  );
} 