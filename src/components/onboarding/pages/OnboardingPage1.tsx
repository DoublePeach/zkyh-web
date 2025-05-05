'use client';

import { motion } from 'framer-motion';
import OnboardingSlide from '../OnboardingSlide';

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

export default function OnboardingPage1() {
  return (
    <OnboardingSlide className="bg-gradient-to-b from-pink-50 to-pink-100">
      <motion.div 
        className="w-full flex flex-col items-center justify-center text-center"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* 粉色圆形背景 */}
        <div className="relative w-full max-w-lg mx-auto px-4">
          <motion.div 
            className="absolute -top-16 md:-top-20 -left-10 md:-left-20 w-48 h-48 md:w-72 md:h-72 bg-pink-300 rounded-full opacity-40 blur-xl"
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.4, 0.5, 0.4]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity,
              repeatType: "reverse" 
            }}
          />
          <motion.div 
            className="absolute top-32 md:top-40 -right-10 md:-right-20 w-64 h-64 md:w-96 md:h-96 bg-pink-300 rounded-full opacity-30 blur-xl"
            animate={{ 
              scale: [1, 1.03, 1],
              opacity: [0.3, 0.4, 0.3]
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity,
              repeatType: "reverse",
              delay: 0.5
            }}
          />
          
          {/* 标题和副标题 */}
          <motion.div 
            className="relative z-10 mb-20 md:mb-24 lg:mb-32 pt-12 md:pt-16"
            variants={itemVariants}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-gray-700 via-gray-900 to-black">智考引航</h1>
            <p className="text-xl md:text-2xl text-gray-600 tracking-wider">AI Navigates</p>
            <motion.div 
              className="w-24 h-1 bg-gradient-to-r from-pink-400 to-pink-600 mx-auto mt-4 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: 96 }}
              transition={{ delay: 0.5, duration: 0.7 }}
            />
          </motion.div>
          
          {/* 中间的引言 */}
          <motion.div 
            className="relative z-10 mt-20 md:mt-24 lg:mt-32"
            variants={itemVariants}
          >
            <div className="text-center text-gray-700">
              <p className="text-2xl md:text-3xl font-medium">
                <span className="text-xl md:text-2xl text-pink-500">&ldquo;</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">一路相伴，</span>
              </p>
              <p className="text-2xl md:text-3xl font-medium mt-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">职称无忧</span>
                <span className="text-xl md:text-2xl text-pink-500">&rdquo;</span>
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </OnboardingSlide>
  );
} 