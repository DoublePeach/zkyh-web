'use client';

import { useState } from 'react';
import OnboardingSlide from '../OnboardingSlide';

interface OnboardingPage4Props {
  onNext?: () => void;
}

// 卡片数据
const advantageCards = [
  {
    id: 'planning',
    title: '智能规划',
    subtitle: 'AI Planning',
    description: '基于您的备考目标和知识基础，定个性化学习规划，并根据任务完成情况和数据反馈实时调整。',
    color: 'bg-pink-100',
  },
  {
    id: 'extraction',
    title: '智慧提炼',
    subtitle: 'AI Extraction',
    description: 'AI深度分析教材和历年真题，聚焦高频核心考点，高效备考，让学习不再迷茫！',
    color: 'bg-blue-100',
  },
  {
    id: 'guidance',
    title: '全程引导',
    subtitle: 'AI Planning',
    description: '将长期目标拆解，让备考不再"望山生畏"，智能生成阶段性小目标，及时鼓励，成就感满满！',
    color: 'bg-purple-100',
  }
];

export default function OnboardingPage4({ onNext }: OnboardingPage4Props) {
  const [currentCard, setCurrentCard] = useState(0);
  
  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % advantageCards.length);
  };
  
  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + advantageCards.length) % advantageCards.length);
  };

  return (
    <OnboardingSlide className="bg-pink-50">
      <div className="w-full flex flex-col items-center">
        {/* 标题 */}
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 md:mb-8">
          3大核心优势，为你护航！！
        </h2>
        
        {/* 卡片区域 */}
        <div className="w-full px-4 md:px-8 relative flex flex-col items-center justify-center">
          <div className="w-full max-w-sm overflow-hidden relative">
            {/* 左箭头 */}
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 z-10">
              <button 
                onClick={prevCard} 
                className="bg-white bg-opacity-70 rounded-full p-1 shadow focus:outline-none text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            
            {/* 卡片内容 */}
            <div className={`${advantageCards[currentCard].color} rounded-lg p-4 md:p-5 shadow-sm w-full`}>
              <div className="flex flex-col">
                <div className="mb-2 md:mb-3">
                  <h3 className="text-lg md:text-xl font-bold text-gray-800">{advantageCards[currentCard].title}</h3>
                  <p className="text-xs md:text-sm text-gray-600">{advantageCards[currentCard].subtitle}</p>
                </div>
                
                {/* 特性描述 */}
                <div className="text-xs md:text-sm text-gray-700 mt-12 mb-12">
                  <p>{advantageCards[currentCard].description}</p>
                </div>
              </div>
            </div>
            
            {/* 右箭头 */}
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 z-10">
              <button 
                onClick={nextCard} 
                className="bg-white bg-opacity-70 rounded-full p-1 shadow focus:outline-none text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* 指示器 */}
          <div className="flex justify-center mt-4 md:mt-6 space-x-2">
            {advantageCards.map((_, index) => (
              <button 
                key={index} 
                onClick={() => setCurrentCard(index)}
                className={`w-2 h-2 rounded-full transition-colors ${index === currentCard ? 'bg-pink-500' : 'bg-pink-200'}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </OnboardingSlide>
  );
} 