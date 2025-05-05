'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface OnboardingSlideProps {
  children: ReactNode;
  className?: string;
}

export default function OnboardingSlide({ children, className = '' }: OnboardingSlideProps) {
  return (
    <motion.div 
      className={`w-full h-full flex flex-col items-center justify-start py-4 px-3 md:py-6 md:px-4 lg:py-8 lg:px-6 overflow-y-auto ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          className="absolute top-0 right-0 w-56 h-56 md:w-80 md:h-80 bg-gradient-to-br from-pink-200 to-pink-300 rounded-full opacity-20 blur-3xl"
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 5, 0],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-56 h-56 md:w-80 md:h-80 bg-gradient-to-tr from-purple-200 to-purple-300 rounded-full opacity-20 blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -5, 0],
            opacity: [0.2, 0.25, 0.2]
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity,
            repeatType: "reverse",
            delay: 2
          }}
        />
      </div>
      
      {/* 内容容器 - 确保手机端显示完整 */}
      <div className="w-full max-w-lg mx-auto relative z-10 flex-1 overflow-visible">
        {children}
      </div>
    </motion.div>
  );
} 