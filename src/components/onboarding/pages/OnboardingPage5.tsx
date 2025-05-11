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
    description: '覆盖 100% 知识点，冲刺高分！',
    icon: '🏅',
    color: 'bg-red-50',
    textColor: 'text-red-600',
    borderColor: 'border-red-400',
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
    color: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-400',
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
    color: 'bg-yellow-50',
    textColor: 'text-yellow-600',
    borderColor: 'border-yellow-400',
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
    description: '佛系备考～通过率可能不足 30%',
    icon: '🎖️',
    color: 'bg-green-50',
    textColor: 'text-green-600',
    borderColor: 'border-green-400',
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
    <div className="flex space-x-1">
      {[...Array(5)].map((_, i) => (
        <span 
          key={i} 
          className={`${i < filled ? 'text-yellow-400' : 'text-gray-300'}`}
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
        className="w-full flex flex-col items-start justify-between h-full"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* 欢迎头部 */}
        <motion.div 
          className="w-full mb-3"
          variants={itemVariants}
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-1">Hi~</h2>
            <p className="text-lg mb-1">欢迎来到智考引航</p>
            <p className="text-base mb-2">考试并不可怕，</p>
            <p className="text-base mb-6">让我们把它当作一次闯关游戏吧！</p>
            <p className="text-base font-medium">请选择您的闯关难度等级：</p>
          </div>
        </motion.div>
        
        {/* 难度选择卡片 - 改为 2x2 网格布局 */}
        <motion.div className="w-full mb-4" variants={itemVariants}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {difficultyLevels.map((level) => (
              <motion.button
                key={level.id}
                className={`rounded-xl overflow-hidden transition-all duration-300 
                  ${selectedDifficulty === level.id 
                    ? `${level.color} shadow-md ${level.borderColor}` 
                    : level.color
                  }`}
                onClick={() => handleDifficultySelect(level.id)}
                whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                animate={selectedDifficulty === level.id ? 
                  { 
                    y: [0, -2, 0],
                    transition: { repeat: 3, duration: 0.2 }
                  } : {}
                }
              >
                <div className="p-3">
                  {/* 难度名称和图标 */}
                  <div className="flex justify-center mb-1">
                    <span className="text-xl">{level.icon}</span>
                  </div>
                  <div className="text-center">
                    <h3 className={`text-base font-bold ${level.textColor}`}>{level.name}</h3>
                    <p className="text-xs text-gray-500">{level.nameEn}</p>
                  </div>
                  
                  {/* 难度说明 */}
                  <div className="mt-2 text-center">
                    <p className="text-xs text-gray-700">{level.description}</p>
                  </div>
                  
                  {/* 能力评分 */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">毅力：</span>
                      <StarRating filled={level.stats.endurance} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">理解力：</span>
                      <StarRating filled={level.stats.understanding} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">记忆力：</span>
                      <StarRating filled={level.stats.memory} />
                    </div>
                  </div>
                  
                  {/* 适合人群 */}
                  <div className="mt-2 flex items-center justify-center">
                    <span className="text-xs text-gray-600 text-center">{level.suitable}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
        
        {/* 开始学习按钮 */}
        <motion.div 
          className="w-full flex flex-col items-center mt-3"
          variants={itemVariants}
        >
          <motion.button
            className={`px-8 py-2.5 rounded-full font-semibold text-base shadow-lg transition-all duration-300 ${
              selectedDifficulty 
                ? 'bg-pink-500 text-white' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            whileHover={selectedDifficulty ? { scale: 1.05, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" } : {}}
            whileTap={selectedDifficulty ? { scale: 0.95 } : {}}
            disabled={!selectedDifficulty}
          >
            开始学习
          </motion.button>
          
          {/* 底部提示 */}
          <motion.p 
            className="mt-3 text-center text-xs text-gray-600"
            variants={itemVariants}
          >
            {selectedDifficulty 
              ? `后续的学习任务将根据选择的难度模式安排哦～`
              : '请选择适合您的难度级别～'}
          </motion.p>
        </motion.div>
      </motion.div>
    </OnboardingSlide>
  );
} 