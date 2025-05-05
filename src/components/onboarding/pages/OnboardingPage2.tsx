'use client';

import { motion } from 'framer-motion';
import OnboardingSlide from '../OnboardingSlide';

interface OnboardingPage2Props {
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

export default function OnboardingPage2({ onNext }: OnboardingPage2Props) {
  return (
    <OnboardingSlide className="bg-pink-50">
      <motion.div 
        className="w-full flex flex-col items-start"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* 标题 */}
        <motion.div className="mb-3 md:mb-6" variants={itemVariants}>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">关于职称考试</h2>
          <p className="text-base md:text-lg text-gray-700">你是否遇到过以下问题：</p>
        </motion.div>
        
        {/* 用户评论卡片 */}
        <motion.div className="space-y-3 md:space-y-4 w-full" variants={itemVariants}>
          {/* 评论1 */}
          <motion.div 
            className="bg-white rounded-lg p-3 md:p-4 shadow-sm"
            variants={itemVariants}
          >
            <div className="flex items-center mb-1 md:mb-2">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 rounded-full overflow-hidden mr-2 md:mr-3 flex-shrink-0">
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 text-xs">头像</span>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-sm md:text-base">momo</h3>
              </div>
            </div>
            <p className="text-gray-700 text-xs md:text-sm">"每天上班忙的像打仗，下班后好不容易有时间学习，书翻开3分钟就开始打瞌睡..."</p>
            <div className="flex justify-between mt-1 md:mt-2 text-xs text-gray-500">
              <span>23:20</span>
              <div className="flex items-center">
                <span className="mr-1">❤️</span>
                <span>3.0万</span>
              </div>
            </div>
          </motion.div>
          
          {/* 评论2 */}
          <motion.div 
            className="bg-white rounded-lg p-3 md:p-4 shadow-sm"
            variants={itemVariants}
          >
            <div className="flex items-center mb-1 md:mb-2">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 rounded-full overflow-hidden mr-2 md:mr-3 flex-shrink-0">
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 text-xs">头像</span>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-sm md:text-base">taotao</h3>
              </div>
            </div>
            <p className="text-gray-700 text-xs md:text-sm">"报名时信心满满买了全套资料，结果学了3天就被抖音短剧拐跑了..."</p>
            <div className="flex justify-between mt-1 md:mt-2 text-xs text-gray-500">
              <span>20:21</span>
              <div className="flex items-center">
                <span className="mr-1">❤️</span>
                <span>11.0万</span>
              </div>
            </div>
          </motion.div>
          
          {/* 评论3 */}
          <motion.div 
            className="bg-white rounded-lg p-3 md:p-4 shadow-sm"
            variants={itemVariants}
          >
            <div className="flex items-center mb-1 md:mb-2">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 rounded-full overflow-hidden mr-2 md:mr-3 flex-shrink-0">
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 text-xs">头像</span>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-sm md:text-base">duoduo</h3>
              </div>
            </div>
            <p className="text-gray-700 text-xs md:text-sm">"考前教材刷了好几遍顺，结果在考场上大脑一片空白，知识点像一盘散沙..."</p>
            <div className="flex justify-between mt-1 md:mt-2 text-xs text-gray-500">
              <span>23:20</span>
              <div className="flex items-center">
                <span className="mr-1">❤️</span>
                <span>6.6万</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* 底部提示文字 */}
        <motion.div className="mt-3 md:mt-6 text-center w-full" variants={itemVariants}>
          <p className="text-blue-500 text-xs md:text-sm">
            <span className="mr-1">🔔</span>
            职称不是终点，是我们照亮患者的下一站星光！
          </p>
        </motion.div>
        
        {/* 底部文字 */}
        <motion.div className="mt-2 md:mt-4 text-center w-full" variants={itemVariants}>
          <p className="text-gray-700 text-sm md:text-base">你并不是一个人在战斗</p>
          <p className="text-gray-700 text-sm md:text-base mt-1">
            这次，让我们为你 <span className="font-bold">"一路护航"</span>
          </p>
        </motion.div>
      </motion.div>
    </OnboardingSlide>
  );
} 