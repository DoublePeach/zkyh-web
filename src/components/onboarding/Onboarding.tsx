'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import OnboardingPage1 from './pages/OnboardingPage1';
import OnboardingPage2 from './pages/OnboardingPage2';
import OnboardingPage3 from './pages/OnboardingPage3';
import OnboardingPage4 from './pages/OnboardingPage4';
import OnboardingPage5 from './pages/OnboardingPage5';

const ONBOARDING_KEY = 'zkyh_has_seen_onboarding';
const DEVICE_ID_KEY = 'zkyh_device_id';

// 页面过渡动画变体
const pageVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.3 }
    }
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.3 }
    }
  })
};

export default function Onboarding() {
  const [currentPage, setCurrentPage] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [direction, setDirection] = useState(0); // 用于动画方向
  const [isMounted, setIsMounted] = useState(false);
  const totalPages = 5;
  const router = useRouter();

  // 生成设备ID的简单实现
  const generateDeviceId = () => {
    const nav = window.navigator;
    const screen = window.screen;
    const hashSource = [
      nav.userAgent,
      screen.height,
      screen.width,
      screen.colorDepth,
      nav.language,
      new Date().getTimezoneOffset()
    ].join('');
    
    let hash = 0;
    for (let i = 0; i < hashSource.length; i++) {
      const char = hashSource.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  };

  useEffect(() => {
    setIsMounted(true);

    // 阻止页面滚动
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    // 清除函数
    return () => {
      document.body.style.overflow = originalOverflow || 'auto';
    };
  }, []);

  useEffect(() => {
    if (isMounted) {
      let deviceId = localStorage.getItem(DEVICE_ID_KEY);
      if (!deviceId) {
        deviceId = generateDeviceId();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
      }
      
      const hasSeenOnboarding = localStorage.getItem(`${ONBOARDING_KEY}_${deviceId}`);
      
      if (hasSeenOnboarding) {
        setShowOnboarding(false);
        router.push('/');
      }
    }
  }, [isMounted, router]);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setDirection(1);
      setCurrentPage(currentPage + 1);
    } else {
      completeOnboarding();
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setDirection(-1);
      setCurrentPage(currentPage - 1);
    }
  };

  const completeOnboarding = () => {
    if (isMounted) {
      const deviceId = localStorage.getItem(DEVICE_ID_KEY);
      if (deviceId) {
        localStorage.setItem(`${ONBOARDING_KEY}_${deviceId}`, 'true');
      }
      router.push('/');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 0:
        return <OnboardingPage1 key="page1" />;
      case 1:
        return <OnboardingPage2 key="page2" />;
      case 2:
        return <OnboardingPage3 key="page3" />;
      case 3:
        return <OnboardingPage4 key="page4" />;
      case 4:
        return <OnboardingPage5 key="page5" />;
      default:
        return <OnboardingPage1 key="page1" />;
    }
  };

  if (!isMounted) {
    return (
      <div className="fixed inset-0 w-full h-full bg-pink-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!showOnboarding) {
    return null;
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-pink-50 flex flex-col items-center justify-between z-50 overflow-hidden">
      <div className="w-full h-full flex flex-col max-w-screen-md mx-auto relative">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div 
            key={currentPage}
            custom={direction}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-grow flex items-center justify-center w-full pb-16 md:pb-20"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
        
        <motion.div 
          className="p-4 flex justify-center items-center fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-pink-50 via-pink-50 to-transparent pt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex space-x-4 items-center">
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={handlePrevPage}
              className={`bg-pink-100 text-pink-600 w-10 h-10 rounded-full flex items-center justify-center ${currentPage === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-pink-200'}`}
              disabled={currentPage === 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </motion.button>
            
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }).map((_, index) => (
                <motion.div
                  key={index}
                  className={`w-2 h-2 rounded-full ${currentPage === index ? 'bg-pink-500' : 'bg-pink-200'}`}
                  whileHover={{ scale: 1.2 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                ></motion.div>
              ))}
            </div>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={handleNextPage}
              className={`bg-pink-100 text-pink-600 w-10 h-10 rounded-full flex items-center justify-center ${currentPage === totalPages - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-pink-200'}`}
              disabled={currentPage === totalPages - 1}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </motion.button>
          </div>
          
          {currentPage === totalPages - 1 && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={completeOnboarding}
              className="ml-6 px-6 py-2 bg-gradient-to-r from-pink-400 to-blue-400 text-white rounded-full font-medium shadow-md"
            >
              开始学习
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
} 