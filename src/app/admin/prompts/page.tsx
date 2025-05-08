/**
 * @description 提示词管理页面
 * @author 郝桃桃
 * @date 2024-10-12
 */

'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  FileText, 
  Trash2, 
  Eye, 
  RefreshCw, 
  FileJson, 
  AlertTriangle,
  FileCode,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { exportToHtml } from '@/lib/utils';

// 工具函数 - 格式化字节大小
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// 工具函数 - 格式化日期
function formatDate(dateString: string) {
  if (!dateString) return '未知时间';
  
  const date = new Date(dateString);
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return '未知时间';
  }
  
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

interface FileItem {
  filename: string;
  path: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
  type: string;
}

export default function PromptsManagementPage() {
  const router = useRouter();
  
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<any>(null);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  
  // 加载文件列表
  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/prompts');
      if (!response.ok) {
        throw new Error('获取提示词文件列表失败');
      }
      
      const data = await response.json();
      if (data.success) {
        setFiles(data.data);
      } else {
        toast.error('获取文件列表失败', {
          description: data.message
        });
      }
    } catch (error) {
      toast.error('获取文件列表失败', {
        description: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 首次加载
  useEffect(() => {
    loadFiles();
  }, []);
  
  // 查看文件内容
  const viewFile = async (file: FileItem) => {
    try {
      const response = await fetch(`/api/admin/prompts/${file.filename}`);
      if (!response.ok) {
        throw new Error('获取文件内容失败');
      }
      
      const data = await response.json();
      if (data.success) {
        setSelectedFile(file);
        setFileContent(data.data.content);
        setFileDialogOpen(true);
      } else {
        toast.error('获取文件内容失败', {
          description: data.message
        });
      }
    } catch (error) {
      toast.error('获取文件内容失败', {
        description: error instanceof Error ? error.message : '未知错误'
      });
    }
  };
  
  // 删除文件
  const deleteFile = async (file: FileItem) => {
    if (!confirm(`确定要删除文件 ${file.filename} 吗？`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/prompts/${file.filename}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('删除文件失败');
      }
      
      const data = await response.json();
      if (data.success) {
        toast.success('文件删除成功', {
          description: `文件 ${file.filename} 已成功删除`
        });
        // 重新加载文件列表
        loadFiles();
      } else {
        toast.error('删除文件失败', {
          description: data.message
        });
      }
    } catch (error) {
      toast.error('删除文件失败', {
        description: error instanceof Error ? error.message : '未知错误'
      });
    }
  };
  
  // 导出为HTML文件
  const exportFileAsHtml = () => {
    if (!selectedFile || !fileContent) return;
    
    try {
      exportToHtml(fileContent, selectedFile.filename);
      toast.success('导出成功', {
        description: `文件 ${selectedFile.filename} 已导出为HTML文件`
      });
    } catch (error) {
      toast.error('导出失败', {
        description: error instanceof Error ? error.message : '未知错误'
      });
    }
  };
  
  // 渲染文件类型图标
  const renderFileIcon = (type: string) => {
    switch (type) {
      case 'prompt':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'response':
        return <FileJson className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'local_plan':
        return <FileCode className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>提示词管理</CardTitle>
            <CardDescription>
              管理备考规划生成过程中的提示词、响应和错误日志
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadFiles}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类型</TableHead>
                  <TableHead>文件名</TableHead>
                  <TableHead>大小</TableHead>
                  <TableHead>修改时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.length === 0 ? (
                  <TableRow key="empty-row">
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      {loading ? '加载中...' : '没有找到文件'}
                    </TableCell>
                  </TableRow>
                ) : (
                  files.map((file) => (
                    <TableRow key={file.path || file.filename}>
                      <TableCell className="flex items-center">
                        {renderFileIcon(file.type)}
                        <span className="ml-2 capitalize">{file.type}</span>
                      </TableCell>
                      <TableCell className="font-mono text-sm truncate max-w-[300px]">
                        {file.filename}
                      </TableCell>
                      <TableCell>{formatBytes(file.size)}</TableCell>
                      <TableCell>{formatDate(file.modifiedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Fragment key={`actions-${file.path || file.filename}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewFile(file)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteFile(file)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </Fragment>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* 文件内容查看对话框 */}
      <Dialog open={fileDialogOpen} onOpenChange={setFileDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {selectedFile && renderFileIcon(selectedFile.type)}
              <span className="ml-2">{selectedFile?.filename}</span>
            </DialogTitle>
            <DialogDescription>
              {selectedFile?.type === 'prompt' ? '提示词内容' : 
               selectedFile?.type === 'response' ? 'API响应内容' : 
               selectedFile?.type === 'error' ? '错误日志' : 
               selectedFile?.type === 'local_plan' ? '本地生成规划' : '文件内容'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 bg-gray-50 p-4 rounded-md">
            {typeof fileContent === 'object' ? (
              <pre className="text-sm font-mono overflow-auto max-h-[60vh] whitespace-pre-wrap">
                {JSON.stringify(fileContent, null, 2)}
              </pre>
            ) : (
              <pre className="whitespace-pre-wrap text-sm font-mono overflow-auto max-h-[60vh]">
                {fileContent}
              </pre>
            )}
          </div>
          
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={exportFileAsHtml}
              disabled={!fileContent}
            >
              <Download className="h-4 w-4 mr-2" />
              导出为HTML
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 