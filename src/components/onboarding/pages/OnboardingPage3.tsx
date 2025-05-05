'use client';

import { motion } from 'framer-motion';
import OnboardingSlide from '../OnboardingSlide';

interface OnboardingPage3Props {
  onNext?: () => void;
}

// 动画变体配置
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function OnboardingPage3({ onNext }: OnboardingPage3Props) {
  return (
    <OnboardingSlide className="bg-pink-50">
      <motion.div 
        className="w-full flex flex-col items-start"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* 标题 */}
        <motion.h2 
          className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-8"
          variants={itemVariants}
        >
          关于我们
        </motion.h2>
        
        {/* 公司信息 */}
        <motion.div 
          className="space-y-2 md:space-y-4 mb-4 md:mb-8"
          variants={itemVariants}
        >
          <motion.div 
            className="flex items-center"
            variants={itemVariants}
          >
            <p className="text-base md:text-lg text-gray-700">深耕医疗教育培训 <span className="text-pink-500 font-bold text-xl md:text-2xl">6</span> 年</p>
          </motion.div>
          
          <motion.div 
            className="flex items-center"
            variants={itemVariants}
          >
            <p className="text-base md:text-lg text-gray-700">
              已服务全国 <span className="text-pink-500 font-bold text-xl md:text-2xl">3000+</span> 家医院护理部
            </p>
          </motion.div>
          
          <motion.div 
            className="flex items-center"
            variants={itemVariants}
          >
            <p className="text-base md:text-lg text-gray-700">
              覆盖 <span className="text-pink-500 font-bold text-xl md:text-2xl">1,100,000</span> 医护人员
            </p>
          </motion.div>
          
          <motion.div 
            className="flex items-center"
            variants={itemVariants}
          >
            <p className="text-base md:text-lg text-gray-700">......</p>
          </motion.div>
        </motion.div>
        
        {/* 插图 */}
        <motion.div 
          className="w-full flex justify-center my-4 md:my-8"
          variants={itemVariants}
        >
          <div className="relative w-60 md:w-80 h-30 md:h-40">
            {/* 由于没有实际图片资源，这里使用CSS创建一个简单的插图占位符 */}
            <motion.div 
              className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 w-36 md:w-48 h-24 md:h-32 absolute left-0 shadow-md"
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="bg-pink-100 h-full w-full rounded"></div>
            </motion.div>
            <div className="absolute right-0 top-6 md:top-8">
              {/* 简单的人物插图 */}
              <div className="w-16 md:w-20 h-24 md:h-32 relative">
                <motion.div 
                  className="absolute top-0 w-8 md:w-10 h-8 md:h-10 rounded-full bg-pink-200"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                ></motion.div>
                <motion.div 
                  className="absolute top-8 md:top-10 w-12 md:w-16 h-16 md:h-20 bg-blue-400 rounded-md"
                  animate={{ rotate: [0, 1, 0, -1, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                ></motion.div>
                <motion.div 
                  className="absolute top-24 md:top-30 right-1 md:right-2 w-4 md:w-6 h-8 md:h-12 bg-blue-400 rounded-md"
                  animate={{ x: [0, 2, 0, -2, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
                ></motion.div>
                <motion.div 
                  className="absolute top-24 md:top-30 left-1 md:left-2 w-4 md:w-6 h-8 md:h-12 bg-blue-400 rounded-md"
                  animate={{ x: [0, -2, 0, 2, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
                ></motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </OnboardingSlide>
  );
} 