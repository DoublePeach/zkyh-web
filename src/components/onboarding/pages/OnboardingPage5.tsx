'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import OnboardingSlide from '../OnboardingSlide';

interface OnboardingPage5Props {
  onComplete: () => void;
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

export default function OnboardingPage5({ onComplete }: OnboardingPage5Props) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  
  const handleDifficultySelect = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
    // 实际场景中可能还需要保存用户选择的难度级别
  };
  
  return (
    <OnboardingSlide className="bg-pink-50">
      <motion.div 
        className="w-full flex flex-col items-start"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* 用户欢迎 */}
        <motion.div 
          className="flex items-start mb-2 md:mb-4 lg:mb-6"
          variants={itemVariants}
        >
          {/* 卡通狗图标 */}
          <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 mr-2 md:mr-3">
            <motion.div 
              className="w-full h-full bg-yellow-200 rounded-full flex items-center justify-center overflow-hidden"
              animate={{ 
                rotate: [0, 5, 0, -5, 0],
                y: [0, -3, 0] 
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                repeatType: "reverse" 
              }}
            >
              <span className="text-lg md:text-xl lg:text-2xl">🐶</span>
            </motion.div>
          </div>
          
          <div>
            <h2 className="text-base md:text-lg lg:text-xl font-bold text-gray-800">Hi~ "用户名"：</h2>
            <p className="text-xs md:text-sm lg:text-base text-gray-700 mt-0.5 md:mt-1">我是你的专属备考领航员 "小汪"</p>
            <p className="text-xs md:text-sm lg:text-base text-gray-700 mt-0.5 md:mt-1">考试并不可怕，</p>
            <p className="text-xs md:text-sm lg:text-base text-gray-700 mt-0.5 md:mt-1">让我们把它当作一次闯关游戏吧！</p>
          </div>
        </motion.div>
        
        {/* 难度选择 */}
        <motion.div className="w-full mb-2 md:mb-4" variants={itemVariants}>
          <h3 className="text-sm md:text-base lg:text-lg font-bold text-gray-800 mb-1.5 md:mb-3">请选择闯关难度等级：</h3>
          
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {/* 困难模式 */}
            <motion.div 
              className={`p-2 md:p-3 rounded-lg ${selectedDifficulty === 'hard' ? 'bg-pink-200 border-2 border-pink-400' : 'bg-pink-100'} cursor-pointer transition-colors`}
              onClick={() => handleDifficultySelect('hard')}
              whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              variants={itemVariants}
            >
              <div className="flex justify-between items-center mb-0.5 md:mb-1">
                <h4 className="font-bold text-xs md:text-sm lg:text-base text-gray-800">学霸模式</h4>
                <span className="text-yellow-500 text-xs md:text-sm">🏅</span>
              </div>
              <p className="text-2xs md:text-xs lg:text-sm text-gray-700 mb-0.5">Hard</p>
              <p className="text-2xs md:text-xs text-gray-600 mb-0.5 md:mb-1">覆盖100%知识点，冲刺高分！</p>
              
              {/* 星级难度指示 */}
              <div className="space-y-0 md:space-y-0.5">
                <div className="flex items-center">
                  <span className="text-2xs md:text-xs w-8 md:w-10 text-gray-600">毅力:</span>
                  <div className="flex">
                    {"★★★★★".split('').map((star, i) => (
                      <span key={i} className="text-yellow-400 text-2xs md:text-xs">★</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-2xs md:text-xs w-8 md:w-10 text-gray-600">理解:</span>
                  <div className="flex">
                    {"★★★★".split('').map((star, i) => (
                      <span key={i} className="text-yellow-400 text-2xs md:text-xs">★</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-2xs md:text-xs w-8 md:w-10 text-gray-600">记忆:</span>
                  <div className="flex">
                    {"★★★★".split('').map((star, i) => (
                      <span key={i} className="text-yellow-400 text-2xs md:text-xs">★</span>
                    ))}
                  </div>
                </div>
              </div>
              
              <p className="text-2xs md:text-xs text-gray-600 mt-0.5 md:mt-1">
                <span className="mr-0.5">💡</span>
                适合综合实力较强的同学
              </p>
            </motion.div>
            
            {/* 英雄模式 */}
            <motion.div 
              className={`p-2 md:p-3 rounded-lg ${selectedDifficulty === 'hero' ? 'bg-yellow-200 border-2 border-yellow-400' : 'bg-yellow-100'} cursor-pointer transition-colors`}
              onClick={() => handleDifficultySelect('hero')}
              whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              variants={itemVariants}
            >
              <div className="flex justify-between items-center mb-0.5 md:mb-1">
                <h4 className="font-bold text-xs md:text-sm lg:text-base text-gray-800">通关模式</h4>
                <span className="text-yellow-500 text-xs md:text-sm">🏆</span>
              </div>
              <p className="text-2xs md:text-xs lg:text-sm text-gray-700 mb-0.5">Hero</p>
              <p className="text-2xs md:text-xs text-gray-600 mb-0.5 md:mb-1">弱化低频考点，稳中取胜！</p>
              
              {/* 星级难度指示 */}
              <div className="space-y-0 md:space-y-0.5">
                <div className="flex items-center">
                  <span className="text-2xs md:text-xs w-8 md:w-10 text-gray-600">毅力:</span>
                  <div className="flex">
                    {"★★★★★".split('').map((star, i) => (
                      <span key={i} className="text-yellow-400 text-2xs md:text-xs">★</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-2xs md:text-xs w-8 md:w-10 text-gray-600">理解:</span>
                  <div className="flex">
                    {"★★★".split('').map((star, i) => (
                      <span key={i} className="text-yellow-400 text-2xs md:text-xs">★</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-2xs md:text-xs w-8 md:w-10 text-gray-600">记忆:</span>
                  <div className="flex">
                    {"★★".split('').map((star, i) => (
                      <span key={i} className="text-yellow-400 text-2xs md:text-xs">★</span>
                    ))}
                  </div>
                </div>
              </div>
              
              <p className="text-2xs md:text-xs text-gray-600 mt-0.5 md:mt-1">
                <span className="mr-0.5">💡</span>
                适合毅力较强的同学
              </p>
            </motion.div>
            
            {/* 普通模式 */}
            <motion.div 
              className={`p-2 md:p-3 rounded-lg ${selectedDifficulty === 'normal' ? 'bg-yellow-200 border-2 border-yellow-400' : 'bg-yellow-50'} cursor-pointer transition-colors`}
              onClick={() => handleDifficultySelect('normal')}
              whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              variants={itemVariants}
            >
              <div className="flex justify-between items-center mb-0.5 md:mb-1">
                <h4 className="font-bold text-xs md:text-sm lg:text-base text-gray-800">基础模式</h4>
                <span className="text-yellow-500 text-xs md:text-sm">🥇</span>
              </div>
              <p className="text-2xs md:text-xs lg:text-sm text-gray-700 mb-0.5">Normal</p>
              <p className="text-2xs md:text-xs text-gray-600 mb-0.5 md:mb-1">核心高频考点及格万岁！</p>
              
              {/* 星级难度指示 */}
              <div className="space-y-0 md:space-y-0.5">
                <div className="flex items-center">
                  <span className="text-2xs md:text-xs w-8 md:w-10 text-gray-600">毅力:</span>
                  <div className="flex">
                    {"★★★".split('').map((star, i) => (
                      <span key={i} className="text-yellow-400 text-2xs md:text-xs">★</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-2xs md:text-xs w-8 md:w-10 text-gray-600">理解:</span>
                  <div className="flex">
                    {"★★".split('').map((star, i) => (
                      <span key={i} className="text-yellow-400 text-2xs md:text-xs">★</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-2xs md:text-xs w-8 md:w-10 text-gray-600">记忆:</span>
                  <div className="flex">
                    {"★★★★★".split('').map((star, i) => (
                      <span key={i} className="text-yellow-400 text-2xs md:text-xs">★</span>
                    ))}
                  </div>
                </div>
              </div>
              
              <p className="text-2xs md:text-xs text-gray-600 mt-0.5 md:mt-1">
                <span className="mr-0.5">💡</span>
                适合记忆力较强的同学
              </p>
            </motion.div>
            
            {/* 简单模式 */}
            <motion.div 
              className={`p-2 md:p-3 rounded-lg ${selectedDifficulty === 'easy' ? 'bg-blue-200 border-2 border-blue-400' : 'bg-blue-50'} cursor-pointer transition-colors`}
              onClick={() => handleDifficultySelect('easy')}
              whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              variants={itemVariants}
            >
              <div className="flex justify-between items-center mb-0.5 md:mb-1">
                <h4 className="font-bold text-xs md:text-sm lg:text-base text-gray-800">简单模式</h4>
                <span className="text-blue-500 text-xs md:text-sm">🎖️</span>
              </div>
              <p className="text-2xs md:text-xs lg:text-sm text-gray-700 mb-0.5">Easy</p>
              <p className="text-2xs md:text-xs text-gray-600 mb-0.5 md:mb-1">佛系备考～通过率不足30%</p>
              
              {/* 星级难度指示 */}
              <div className="space-y-0 md:space-y-0.5">
                <div className="flex items-center">
                  <span className="text-2xs md:text-xs w-8 md:w-10 text-gray-600">毅力:</span>
                  <div className="flex">
                    {"★".split('').map((star, i) => (
                      <span key={i} className="text-yellow-400 text-2xs md:text-xs">★</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-2xs md:text-xs w-8 md:w-10 text-gray-600">理解:</span>
                  <div className="flex">
                    {"★★".split('').map((star, i) => (
                      <span key={i} className="text-yellow-400 text-2xs md:text-xs">★</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-2xs md:text-xs w-8 md:w-10 text-gray-600">记忆:</span>
                  <div className="flex">
                    {"★".split('').map((star, i) => (
                      <span key={i} className="text-yellow-400 text-2xs md:text-xs">★</span>
                    ))}
                  </div>
                </div>
              </div>
              
              <p className="text-2xs md:text-xs text-gray-600 mt-0.5 md:mt-1">
                <span className="mr-0.5">💡</span>
                适合运气好的同学
              </p>
            </motion.div>
          </div>
        </motion.div>
        
        {/* 底部提示 */}
        <motion.p 
          className="text-2xs md:text-xs lg:text-sm text-gray-600 mb-2 md:mb-4 w-full text-center"
          variants={itemVariants}
        >
          后续的学习任务会根据选择的难度模式安排哦～
        </motion.p>
      </motion.div>
    </OnboardingSlide>
  );
} 