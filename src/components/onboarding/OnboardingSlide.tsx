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
      className={`w-full h-full flex flex-col items-center justify-start py-4 px-4 md:py-6 md:px-8 lg:p-12 overflow-y-auto ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-lg mx-auto min-h-full overflow-y-auto custom-scrollbar pb-16 md:pb-20">
        {children}
      </div>
    </motion.div>
  );
} 