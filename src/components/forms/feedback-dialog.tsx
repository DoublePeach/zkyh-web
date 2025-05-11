'use client';

/**
 * @description 用户反馈对话框组件
 * @author 郝桃桃
 * @date 2024-05-10
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogHeader,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FeedbackForm } from './feedback-form';
import { X } from 'lucide-react';

interface FeedbackDialogProps {
  children?: React.ReactNode;
  source?: string;
  onSuccess?: () => void;
}

export function FeedbackDialog({ children, source = 'study_plans', onSuccess }: FeedbackDialogProps) {
  const [open, setOpen] = React.useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="text-pink-600 border-pink-600 hover:bg-pink-50">
            提供反馈
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[480px] p-0 gap-0 rounded-lg">
        <DialogHeader className="p-5 pb-0 sm:p-6 sm:pb-0">
          <DialogTitle className="text-lg font-semibold text-center">用户反馈</DialogTitle>
          <DialogClose 
            className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">关闭</span>
          </DialogClose>
        </DialogHeader>
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <FeedbackForm onClose={handleClose} source={source} onSuccess={onSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
} 