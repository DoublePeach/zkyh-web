'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OnboardingSlide from '../OnboardingSlide';

// 卡片数据
const advantageCards = [
  {
    id: 'extraction',
    title: '智慧提炼',
    subtitle: 'AI Extraction',
    description: 'AI深度分析教材和历年真题，聚焦高频核心考点，高效备考，让学习不再迷茫！',
    color: 'bg-blue-500',
    icon: '🔍',
  },
  {
    id: 'planning',
    title: '智能规划',
    subtitle: 'AI Planning',
    description: '基于您的备考目标和知识基础，定制个性化学习规划，并根据任务完成情况和数据反馈实时调整。',
    color: 'bg-pink-500',
    icon: '📊',
  },
  {
    id: 'guidance',
    title: '全程引导',
    subtitle: 'AI Guidance',
    description: '将长期目标拆解，让备考不再"望山生畏"，智能生成阶段性小目标，及时鼓励，成就感满满！',
    color: 'bg-purple-500',
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
    if (touchStart - touchEnd > 50) {
      // 左滑
      nextCard();
    }
    
    if (touchEnd - touchStart > 50) {
      // 右滑
      prevCard();
    }
  };

  return (
    <OnboardingSlide className="bg-gradient-to-b from-pink-50 to-pink-100">
      <div className="w-full flex flex-col items-center justify-center h-full py-2">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-4 w-full"
        >
          <h2 className="text-xl md:text-2xl font-bold mb-2">
            3大核心优势，为您护航！
          </h2>
          <div className="h-1 w-20 bg-pink-400 rounded-full mx-auto"></div>
        </motion.div>
        
        {/* 指示器 - 移到轮播图上方 */}
        <div className="flex justify-center mb-3 space-x-2">
          {advantageCards.map((_, index) => (
            <button 
              key={index} 
              onClick={() => {
                setDirection(index > currentCard ? 1 : -1);
                setCurrentCard(index);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 focus:outline-none
                ${index === currentCard 
                  ? 'bg-pink-500 w-5' 
                  : 'bg-gray-300 hover:bg-gray-400'
                }`}
              aria-label={`切换到第 ${index + 1} 页`}
            />
          ))}
        </div>
        
        {/* 轮播卡片区域 - 简化设计，移除多余装饰 */}
        <div className="w-full mb-4 flex-grow flex flex-col justify-center relative">
          <div 
            className="relative w-full max-w-xs mx-auto aspect-[4/3] overflow-visible"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* 左右箭头 */}
            <button 
              onClick={prevCard}
              className="absolute -left-2 md:-left-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center focus:outline-none"
              aria-label="上一个"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-600">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            
            <button 
              onClick={nextCard}
              className="absolute -right-2 md:-right-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center focus:outline-none"
              aria-label="下一个"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-600">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            
            {/* 卡片轮播 */}
            <div className="w-full h-full relative">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={currentCard}
                  custom={direction}
                  initial={{ 
                    x: direction > 0 ? 200 : -200,
                    opacity: 0 
                  }}
                  animate={{ 
                    x: 0,
                    opacity: 1 
                  }}
                  exit={{ 
                    x: direction > 0 ? -200 : 200,
                    opacity: 0 
                  }}
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  className={`absolute inset-0 w-full h-full ${advantageCards[currentCard].color} rounded-xl overflow-hidden shadow-lg`}
                >
                  {/* 卡片内容 - 简化布局 */}
                  <div className="w-full h-full p-4 flex flex-col text-white">
                    {/* 卡片标题 */}
                    <div className="mb-1 flex items-center">
                      <span className="text-xl mr-2">{advantageCards[currentCard].icon}</span>
                      <div>
                        <h3 className="text-lg font-bold">{advantageCards[currentCard].title}</h3>
                        <p className="text-xs text-white text-opacity-80">{advantageCards[currentCard].subtitle}</p>
                      </div>
                    </div>
                    
                    {/* 分隔线 */}
                    <div className="w-full h-px bg-white bg-opacity-20 my-2"></div>
                    
                    {/* 卡片描述 */}
                    <div className="flex-grow flex items-center">
                      <p className="text-sm leading-relaxed">
                        {advantageCards[currentCard].description}
                      </p>
                    </div>
                    
                    {/* 页码 */}
                    <div className="self-end mt-2">
                      <span className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded-full">
                        {currentCard + 1}/{advantageCards.length}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        {/* 底部说明 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-white rounded-lg p-3 shadow-sm border border-pink-100 text-center max-w-md mx-auto w-full"
        >
          <p className="text-gray-700 text-sm">
            <span className="text-pink-500 font-medium">智能AI系统</span> 助您高效备考，通过数据和人工智能分析，为每一位考生提供定制学习体验
          </p>
        </motion.div>
      </div>
    </OnboardingSlide>
  );
} 