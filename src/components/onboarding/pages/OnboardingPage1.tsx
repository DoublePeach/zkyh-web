'use client';

import { motion } from 'framer-motion';
import OnboardingSlide from '../OnboardingSlide';

interface OnboardingPage1Props {
  onNext?: () => void;
}

// 动画变体配置
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function OnboardingPage1({ onNext }: OnboardingPage1Props) {
  return (
    <OnboardingSlide className="bg-pink-50">
      <motion.div 
        className="w-full flex flex-col items-center justify-center text-center"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* 粉色圆形背景 */}
        <div className="relative">
          <motion.div 
            className="absolute -top-16 md:-top-20 -left-6 md:-left-10 w-40 h-40 md:w-64 md:h-64 bg-pink-300 rounded-full opacity-50 blur-md"
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.5, 0.6, 0.5]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity,
              repeatType: "reverse" 
            }}
          ></motion.div>
          <motion.div 
            className="absolute top-32 md:top-40 -right-6 md:-right-10 w-60 h-60 md:w-80 md:h-80 bg-pink-300 rounded-full opacity-40 blur-md"
            animate={{ 
              scale: [1, 1.03, 1],
              opacity: [0.4, 0.5, 0.4]
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity,
              repeatType: "reverse",
              delay: 0.5
            }}
          ></motion.div>
          
          {/* 标题和副标题 */}
          <motion.div 
            className="relative z-10 mb-16 md:mb-20 lg:mb-32"
            variants={itemVariants}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">智考引航</h1>
            <p className="text-lg md:text-xl text-gray-600">AI Navigates</p>
          </motion.div>
          
          {/* 中间的引言 */}
          <motion.div 
            className="relative z-10 mt-16 md:mt-20 lg:mt-32"
            variants={itemVariants}
          >
            <div className="text-center text-gray-700">
              <p className="text-xl md:text-2xl">
                <span className="text-lg md:text-xl">"</span>一路相伴，
              </p>
              <p className="text-xl md:text-2xl mt-1">
                职称无忧<span className="text-lg md:text-xl">"</span>
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </OnboardingSlide>
  );
} 