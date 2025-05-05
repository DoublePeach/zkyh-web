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

export default function OnboardingPage2() {
  return (
    <OnboardingSlide className="bg-gradient-to-b from-pink-50 to-pink-100">
      <motion.div 
        className="w-full flex flex-col items-start"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* 标题 */}
        <motion.div className="mb-5 md:mb-8 w-full" variants={itemVariants}>
          <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-900 mb-2">关于职称考试</h2>
          <div className="flex items-center">
            <div className="h-1 w-16 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full"></div>
            <p className="ml-4 text-base md:text-lg text-gray-700">你是否遇到过以下问题：</p>
          </div>
        </motion.div>
        
        {/* 用户评论卡片 */}
        <motion.div className="space-y-4 md:space-y-5 w-full" variants={itemVariants}>
          {/* 评论1 */}
          <motion.div 
            className="bg-white rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow duration-300 border border-pink-100"
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="flex items-center mb-2 md:mb-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-pink-200 to-pink-300 rounded-full overflow-hidden mr-3 md:mr-4 flex-shrink-0 flex items-center justify-center shadow-sm">
                <span className="text-pink-600 text-sm md:text-base font-medium">MO</span>
              </div>
              <div>
                <h3 className="font-semibold text-base md:text-lg text-gray-800">momo</h3>
                <div className="flex items-center">
                  <span className="text-xs text-pink-500">护士</span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-xs text-gray-500">23:20</span>
                </div>
              </div>
              <div className="flex items-center ml-auto">
                <span className="text-pink-500">❤️</span>
                <span className="ml-1 text-xs text-gray-500 font-medium">3.0万</span>
              </div>
            </div>
            <p className="text-gray-700 text-sm md:text-base leading-relaxed">&ldquo;每天上班忙的像打仗，下班后好不容易有时间学习，书翻开3分钟就开始打瞌睡...&rdquo;</p>
          </motion.div>
          
          {/* 评论2 */}
          <motion.div 
            className="bg-white rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow duration-300 border border-pink-100"
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="flex items-center mb-2 md:mb-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full overflow-hidden mr-3 md:mr-4 flex-shrink-0 flex items-center justify-center shadow-sm">
                <span className="text-blue-600 text-sm md:text-base font-medium">TT</span>
              </div>
              <div>
                <h3 className="font-semibold text-base md:text-lg text-gray-800">taotao</h3>
                <div className="flex items-center">
                  <span className="text-xs text-blue-500">护士长</span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-xs text-gray-500">20:21</span>
                </div>
              </div>
              <div className="flex items-center ml-auto">
                <span className="text-pink-500">❤️</span>
                <span className="ml-1 text-xs text-gray-500 font-medium">11.0万</span>
              </div>
            </div>
            <p className="text-gray-700 text-sm md:text-base leading-relaxed">&ldquo;报名时信心满满买了全套资料，结果学了3天就被抖音短剧拐跑了...&rdquo;</p>
          </motion.div>
          
          {/* 评论3 */}
          <motion.div 
            className="bg-white rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow duration-300 border border-pink-100"
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="flex items-center mb-2 md:mb-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-200 to-purple-300 rounded-full overflow-hidden mr-3 md:mr-4 flex-shrink-0 flex items-center justify-center shadow-sm">
                <span className="text-purple-600 text-sm md:text-base font-medium">DD</span>
              </div>
              <div>
                <h3 className="font-semibold text-base md:text-lg text-gray-800">duoduo</h3>
                <div className="flex items-center">
                  <span className="text-xs text-purple-500">主管护师</span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-xs text-gray-500">23:20</span>
                </div>
              </div>
              <div className="flex items-center ml-auto">
                <span className="text-pink-500">❤️</span>
                <span className="ml-1 text-xs text-gray-500 font-medium">6.6万</span>
              </div>
            </div>
            <p className="text-gray-700 text-sm md:text-base leading-relaxed">&ldquo;考前教材刷了好几遍顺，结果在考场上大脑一片空白，知识点像一盘散沙...&rdquo;</p>
          </motion.div>
        </motion.div>
        
        {/* 底部提示文字 */}
        <motion.div 
          className="mt-5 md:mt-7 text-center w-full" 
          variants={itemVariants}
        >
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p className="text-blue-600 text-sm md:text-base font-medium">
              <span className="inline-block mr-2 transform -translate-y-px">🔔</span>
              职称不是终点，是我们照亮患者的下一站星光！
            </p>
          </div>
        </motion.div>
        
        {/* 底部文字 */}
        <motion.div 
          className="mt-4 md:mt-6 text-center w-full bg-gradient-to-r from-pink-100 to-pink-200 p-4 rounded-lg shadow-sm" 
          variants={itemVariants}
        >
          <p className="text-gray-800 text-base md:text-lg font-medium">你并不是一个人在战斗</p>
          <p className="text-gray-800 text-base md:text-lg font-medium mt-1">
            这次，让我们为你 <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">&ldquo;一路护航&rdquo;</span>
          </p>
        </motion.div>
      </motion.div>
    </OnboardingSlide>
  );
} 