'use client';

import { motion } from 'framer-motion';
import OnboardingSlide from '../OnboardingSlide';

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

export default function OnboardingPage3() {
  return (
    <OnboardingSlide className="bg-gradient-to-b from-pink-50 to-pink-100">
      <motion.div 
        className="w-full flex flex-col items-start"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* 标题 */}
        <motion.div
          className="mb-6 md:mb-8 w-full"
          variants={itemVariants}
        >
          <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-900 mb-2">
            关于我们
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full"></div>
        </motion.div>
        
        {/* 公司信息 */}
        <motion.div 
          className="w-full mb-6 md:mb-8"
          variants={itemVariants}
        >
          <div className="bg-white rounded-xl p-5 shadow-sm border border-pink-100">
            {/* 统计数据行 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              {/* 年数 */}
              <motion.div 
                className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 text-center shadow-sm"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-gray-700 text-sm mb-1">深耕医疗教育培训</p>
                <div className="flex items-center justify-center">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 font-bold text-4xl md:text-5xl">6</span>
                  <span className="text-gray-600 text-xl ml-1">年</span>
                </div>
              </motion.div>
              
              {/* 医院数 */}
              <motion.div 
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center shadow-sm"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-gray-700 text-sm mb-1">已服务全国医院护理部</p>
                <div className="flex items-center justify-center">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 font-bold text-4xl md:text-5xl">3000+</span>
                  <span className="text-gray-600 text-xl ml-1">家</span>
                </div>
              </motion.div>
              
              {/* 人数 */}
              <motion.div 
                className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center shadow-sm"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-gray-700 text-sm mb-1">覆盖医护人员</p>
                <div className="flex items-center justify-center">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 font-bold text-3xl md:text-4xl">1,100,000+</span>
                  <span className="text-gray-600 text-xl ml-1">人</span>
                </div>
              </motion.div>
            </div>
            
            {/* 使命宣言 */}
            <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg p-4 text-center">
              <p className="text-sm md:text-base text-gray-700 font-medium">我们致力于为医护人员提供高效、智能的学习体验</p>
              <p className="text-sm md:text-base text-gray-700 font-medium mt-1">让每一位医护人员都能轻松应对职称考试</p>
            </div>
          </div>
        </motion.div>
        
        {/* 插图区域 */}
        <motion.div 
          className="w-full flex justify-center my-6"
          variants={itemVariants}
        >
          <div className="relative w-full max-w-md mx-auto h-48 md:h-56">
            {/* 左侧平板 */}
            <motion.div 
              className="absolute left-4 md:left-10 top-0 w-32 md:w-44 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              whileHover={{ 
                y: -10, 
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                transition: { duration: 0.2 }
              }}
            >
              <div className="h-4 bg-gradient-to-r from-pink-400 to-pink-600 w-full"></div>
              <div className="p-3">
                <div className="h-2 bg-pink-100 rounded-full w-3/4 mb-2"></div>
                <div className="h-2 bg-pink-100 rounded-full w-full mb-2"></div>
                <div className="h-2 bg-pink-100 rounded-full w-2/3"></div>
                <div className="h-10 bg-gradient-to-r from-pink-100 to-pink-200 rounded-lg mt-3 flex items-center justify-center">
                  <div className="h-2 bg-pink-300 rounded-full w-1/2"></div>
                </div>
              </div>
            </motion.div>
            
            {/* 医护人员图标 */}
            <motion.div 
              className="absolute right-8 md:right-16 top-6 md:top-4 z-10"
              animate={{ 
                y: [0, -5, 0],
                rotate: [0, 2, 0, -2, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 4,
                ease: "easeInOut"
              }}
            >
              <div className="relative">
                <div className="w-16 md:w-20 h-16 md:h-20 rounded-full bg-blue-200 overflow-hidden flex items-center justify-center">
                  <div className="bg-blue-400 w-12 md:w-16 h-12 md:h-16 rounded-t-full absolute top-5 md:top-7">
                    <div className="w-10 h-5 bg-blue-200 rounded-t-full absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                  </div>
                </div>
                <div className="w-20 md:w-24 h-20 md:h-24 bg-blue-400 rounded-md mt-1 flex flex-col items-center">
                  <div className="w-12 md:w-14 h-4 bg-white rounded-full mt-2"></div>
                  <div className="w-8 md:w-10 h-3 bg-white rounded-full mt-1"></div>
                </div>
                <motion.div 
                  className="w-6 md:w-8 h-12 md:h-14 bg-blue-400 rounded-md absolute bottom-0 left-2"
                  animate={{ rotate: [0, 5, 0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                ></motion.div>
                <motion.div 
                  className="w-6 md:w-8 h-12 md:h-14 bg-blue-400 rounded-md absolute bottom-0 right-2"
                  animate={{ rotate: [0, -5, 0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                ></motion.div>
              </div>
            </motion.div>
            
            {/* 右侧手机 */}
            <motion.div 
              className="absolute right-2 md:right-6 bottom-0 w-16 md:w-20 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden h-32 md:h-40"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              whileHover={{ 
                y: -10, 
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                transition: { duration: 0.2 }
              }}
            >
              <div className="h-2 bg-gradient-to-r from-pink-400 to-pink-600 w-full"></div>
              <div className="p-1 md:p-2">
                <div className="h-1 bg-pink-100 rounded-full w-full mb-1"></div>
                <div className="h-1 bg-pink-100 rounded-full w-2/3 mb-1"></div>
                <div className="h-1 bg-pink-100 rounded-full w-full mb-1"></div>
                <div className="h-6 md:h-8 bg-gradient-to-r from-pink-100 to-pink-200 rounded mt-1 flex items-center justify-center">
                  <div className="h-1 bg-pink-300 rounded-full w-1/2"></div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </OnboardingSlide>
  );
} 