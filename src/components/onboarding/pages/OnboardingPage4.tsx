'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OnboardingSlide from '../OnboardingSlide';

// 卡片数据
const advantageCards = [
  {
    id: 'planning',
    title: '智能规划',
    subtitle: 'AI Planning',
    description: '基于您的备考目标和知识基础，定制个性化学习规划，并根据任务完成情况和数据反馈实时调整。',
    color: 'from-pink-500 to-rose-400',
    icon: '📊',
  },
  {
    id: 'extraction',
    title: '智慧提炼',
    subtitle: 'AI Extraction',
    description: 'AI深度分析教材和历年真题，聚焦高频核心考点，高效备考，让学习不再迷茫！',
    color: 'from-blue-500 to-indigo-500',
    icon: '🔍',
  },
  {
    id: 'guidance',
    title: '全程引导',
    subtitle: 'AI Guidance',
    description: '将长期目标拆解，让备考不再"望山生畏"，智能生成阶段性小目标，及时鼓励，成就感满满！',
    color: 'from-purple-500 to-violet-500',
    icon: '🧭',
  }
];

export default function OnboardingPage4() {
  const [currentCard, setCurrentCard] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [direction, setDirection] = useState(0);

  // 自动滚动
  useEffect(() => {
    const interval = setInterval(() => {
      nextCard();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [currentCard]);
  
  const nextCard = () => {
    setDirection(1);
    setCurrentCard((prev) => (prev + 1) % advantageCards.length);
  };
  
  const prevCard = () => {
    setDirection(-1);
    setCurrentCard((prev) => (prev - 1 + advantageCards.length) % advantageCards.length);
  };

  // 触摸处理
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 100) {
      // 左滑
      nextCard();
    }
    
    if (touchEnd - touchStart > 100) {
      // 右滑
      prevCard();
    }
  };

  return (
    <OnboardingSlide className="bg-gradient-to-b from-pink-50 to-pink-100">
      <div className="w-full flex flex-col items-center">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 md:mb-8 w-full"
        >
          <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-900 mb-2">
            3大核心优势，为你护航！
          </h2>
          <div className="h-1 w-24 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full mx-auto"></div>
        </motion.div>
        
        {/* 卡片轮播区域 */}
        <div 
          className="w-full relative mb-5 md:mb-8"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* 卡片容器 */}
          <div className="w-full max-w-sm mx-auto h-80 md:h-96 relative overflow-hidden rounded-2xl shadow-lg">
            {/* 动画包装器 */}
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentCard}
                custom={direction}
                initial={{ 
                  x: direction > 0 ? 300 : -300,
                  opacity: 0 
                }}
                animate={{ 
                  x: 0,
                  opacity: 1 
                }}
                exit={{ 
                  x: direction > 0 ? -300 : 300,
                  opacity: 0 
                }}
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className={`w-full h-full bg-gradient-to-br ${advantageCards[currentCard].color} rounded-2xl p-6 flex flex-col shadow-xl`}
              >
                {/* 卡片头部 */}
                <div className="mb-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-white text-3xl mr-3">{advantageCards[currentCard].icon}</span>
                      <div>
                        <h3 className="text-white text-xl md:text-2xl font-bold">{advantageCards[currentCard].title}</h3>
                        <p className="text-white text-opacity-80 text-sm">{advantageCards[currentCard].subtitle}</p>
                      </div>
                    </div>
                    <div className="bg-white bg-opacity-20 w-10 h-10 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl">{currentCard + 1}</span>
                    </div>
                  </div>
                </div>

                {/* 横线分隔 */}
                <div className="w-full h-px bg-white bg-opacity-30 mb-5"></div>
                
                {/* 卡片内容 */}
                <div className="flex-grow flex flex-col justify-center">
                  <p className="text-white text-lg md:text-xl leading-relaxed">
                    {advantageCards[currentCard].description}
                  </p>
                </div>
                
                {/* 动画装饰元素 */}
                <motion.div 
                  className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white bg-opacity-10"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 10, 0] 
                  }}
                  transition={{ 
                    duration: 8,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                ></motion.div>
                
                <motion.div 
                  className="absolute top-10 -left-20 w-40 h-40 rounded-full bg-white bg-opacity-10"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, -15, 0] 
                  }}
                  transition={{ 
                    duration: 10,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                ></motion.div>
              </motion.div>
            </AnimatePresence>
            
            {/* 左箭头 */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                prevCard();
              }}
              className="absolute top-1/2 -left-5 transform -translate-y-1/2 z-10 bg-white rounded-full w-10 h-10 shadow-md flex items-center justify-center focus:outline-none hover:bg-gray-50 transition-colors"
              aria-label="上一个"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* 右箭头 */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                nextCard();
              }}
              className="absolute top-1/2 -right-5 transform -translate-y-1/2 z-10 bg-white rounded-full w-10 h-10 shadow-md flex items-center justify-center focus:outline-none hover:bg-gray-50 transition-colors"
              aria-label="下一个"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* 指示器 */}
          <div className="flex justify-center mt-6 space-x-3">
            {advantageCards.map((_, index) => (
              <button 
                key={index} 
                onClick={() => {
                  setDirection(index > currentCard ? 1 : -1);
                  setCurrentCard(index);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none
                  ${index === currentCard 
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 w-8' 
                    : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
        
        {/* 底部说明 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-pink-100 text-center max-w-md mx-auto"
        >
          <p className="text-gray-700 text-sm md:text-base">
            <span className="text-pink-500 font-medium">智能AI系统</span> 助您高效备考，通过数据和人工智能分析，为每一位考生提供定制学习体验
          </p>
        </motion.div>
      </div>
    </OnboardingSlide>
  );
} 