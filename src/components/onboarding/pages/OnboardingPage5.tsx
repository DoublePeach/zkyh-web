'use client';

import { useState } from 'react';
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

// 难度等级数据
const difficultyLevels = [
  {
    id: 'hard',
    name: '学霸模式',
    nameEn: 'Hard',
    description: '覆盖100%知识点，冲刺高分！',
    icon: '🏅',
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-100',
    borderColor: 'border-pink-500',
    stats: {
      endurance: 5,
      understanding: 4,
      memory: 4
    },
    suitable: '适合综合实力较强的同学'
  },
  {
    id: 'hero',
    name: '通关模式',
    nameEn: 'Hero',
    description: '弱化低频考点，稳中取胜！',
    icon: '🏆',
    color: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-500',
    stats: {
      endurance: 5,
      understanding: 3,
      memory: 2
    },
    suitable: '适合毅力较强的同学'
  },
  {
    id: 'normal',
    name: '基础模式',
    nameEn: 'Normal',
    description: '核心高频考点及格万岁！',
    icon: '🥇',
    color: 'from-indigo-500 to-blue-500',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-500',
    stats: {
      endurance: 3,
      understanding: 2,
      memory: 5
    },
    suitable: '适合记忆力较强的同学'
  },
  {
    id: 'easy',
    name: '简单模式',
    nameEn: 'Easy',
    description: '佛系备考～通过率不足30%',
    icon: '🎖️',
    color: 'from-green-500 to-teal-500',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-500',
    stats: {
      endurance: 1,
      understanding: 2,
      memory: 1
    },
    suitable: '适合运气好的同学'
  }
];

// 星级评分组件
const StarRating = ({ filled }: { filled: number }) => {
  return (
    <div className="flex space-x-0.5">
      {[...Array(5)].map((_, i) => (
        <span 
          key={i} 
          className={`text-2xs md:text-xs ${i < filled ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default function OnboardingPage5() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  
  const handleDifficultySelect = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
  };
  
  return (
    <OnboardingSlide className="bg-gradient-to-b from-pink-50 to-pink-100">
      <motion.div 
        className="w-full flex flex-col items-start"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* 欢迎标题 */}
        <motion.div 
          className="w-full mb-3 md:mb-4"
          variants={itemVariants}
        >
          <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-pink-100 flex items-start sm:items-center">
            {/* 狗狗图标 */}
            <motion.div 
              className="w-10 h-10 md:w-14 md:h-14 flex-shrink-0 relative mr-2 md:mr-3"
              animate={{ 
                rotate: [0, 5, 0, -5, 0],
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
              }}
            >
              <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full flex items-center justify-center shadow-md overflow-hidden border-2 border-white">
                <span className="text-lg md:text-xl">🐶</span>
              </div>
              <motion.div
                className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xs md:text-xs border-2 border-white shadow-sm"
                animate={{
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
              >
                AI
              </motion.div>
            </motion.div>
            
            {/* 欢迎文字 */}
            <div className="flex-grow">
              <h2 className="text-base md:text-lg font-bold text-gray-800">Hi~ <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">&ldquo;用户名&rdquo;</span></h2>
              <p className="text-xs md:text-sm text-gray-700">我是你的专属备考领航员，考试并不可怕!</p>
              <p className="text-2xs md:text-xs text-gray-500">让我们把它当作一次闯关游戏吧!</p>
            </div>
          </div>
        </motion.div>
        
        {/* 难度选择 */}
        <motion.div className="w-full mb-3" variants={itemVariants}>
          <div className="px-2 md:px-3 py-2">
            <h3 className="text-base md:text-lg font-bold text-gray-800 mb-2 flex items-center">
              <span className="text-pink-500 mr-2">🎮</span> 请选择闯关难度等级：
            </h3>
          </div>
          
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
            {difficultyLevels.map((level) => (
              <motion.button
                key={level.id}
                className={`rounded-xl overflow-hidden transition-all duration-300 ${
                  selectedDifficulty === level.id 
                    ? `border-2 ${level.borderColor} shadow-md` 
                    : 'border border-transparent hover:border-gray-200'
                }`}
                onClick={() => handleDifficultySelect(level.id)}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                animate={selectedDifficulty === level.id ? 
                  { 
                    y: [0, -2, 0],
                    transition: { repeat: 3, duration: 0.2 }
                  } : {}
                }
              >
                <div className={`${selectedDifficulty === level.id ? `bg-gradient-to-r ${level.color}` : level.bgColor} p-2 md:p-3 ${selectedDifficulty === level.id ? 'text-white' : 'text-gray-800'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-base md:text-lg mr-1.5 md:mr-2">{level.icon}</span>
                      <div className="text-left">
                        <h4 className="font-bold text-sm md:text-base">{level.name}</h4>
                        <p className={`text-2xs md:text-xs ${selectedDifficulty === level.id ? 'text-white text-opacity-90' : 'text-gray-600'}`}>{level.nameEn}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={`p-2 bg-white ${selectedDifficulty === level.id ? 'bg-opacity-95' : ''}`}>
                  <p className="text-2xs md:text-xs text-gray-700 font-medium mb-1">{level.description}</p>
                  
                  <div className="space-y-0.5 mb-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-2xs md:text-xs text-gray-600 w-12 md:w-14 flex-shrink-0">毅力:</span>
                      <StarRating filled={level.stats.endurance} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-2xs md:text-xs text-gray-600 w-12 md:w-14 flex-shrink-0">理解:</span>
                      <StarRating filled={level.stats.understanding} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-2xs md:text-xs text-gray-600 w-12 md:w-14 flex-shrink-0">记忆:</span>
                      <StarRating filled={level.stats.memory} />
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="mr-0.5 text-yellow-500 text-2xs md:text-xs">💡</span>
                    <span className="text-2xs text-gray-600">{level.suitable}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
        
        {/* 开始学习按钮 */}
        <motion.div 
          className="w-full flex justify-center mt-1 md:mt-2"
          variants={itemVariants}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            className={`px-5 py-2 md:px-6 md:py-2.5 rounded-full font-semibold text-sm md:text-base shadow-lg transition-all duration-300 ${
              selectedDifficulty 
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            whileHover={selectedDifficulty ? { scale: 1.05, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" } : {}}
            whileTap={selectedDifficulty ? { scale: 0.95 } : {}}
            disabled={!selectedDifficulty}
            animate={selectedDifficulty ? 
              { 
                scale: [1, 1.05, 1],
                transition: { repeat: Infinity, duration: 2, repeatType: "reverse" }
              } : {}
            }
          >
            开始学习
            <span className="ml-1 md:ml-2">{selectedDifficulty ? '🚀' : '⏳'}</span>
          </motion.button>
        </motion.div>
        
        {/* 底部提示 */}
        <motion.p 
          className="w-full mt-2 text-center text-2xs md:text-xs text-gray-600"
          variants={itemVariants}
        >
          {selectedDifficulty 
            ? `后续学习任务将按照${
                selectedDifficulty === 'hard' ? '学霸模式' 
                : selectedDifficulty === 'hero' ? '通关模式' 
                : selectedDifficulty === 'normal' ? '基础模式' 
                : '简单模式'
              }为您安排～`
            : '请选择适合您的难度级别～'}
        </motion.p>
      </motion.div>
    </OnboardingSlide>
  );
} 