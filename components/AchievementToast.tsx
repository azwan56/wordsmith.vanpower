import React, { useState, useEffect } from 'react';
import { Achievement } from '../types';

interface AchievementToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      // Slide in
      setTimeout(() => setIsVisible(true), 50);
      // Auto dismiss after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 400);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [achievement, onDismiss]);

  if (!achievement) return null;

  return (
    <div className="fixed top-4 left-1/2 z-50 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
      <div
        className={`pointer-events-auto transition-all duration-400 ease-out ${
          isVisible 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 -translate-y-8 scale-95'
        }`}
      >
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-yellow-200 px-6 py-4 flex items-center gap-4 min-w-[320px] max-w-[420px] relative overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-50/50 to-transparent animate-pulse" />
          
          {/* Icon */}
          <div className="relative z-10 w-14 h-14 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center text-3xl shadow-sm flex-shrink-0">
            {achievement.icon}
          </div>
          
          {/* Text */}
          <div className="relative z-10 flex-1">
            <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest mb-0.5">
              🎉 Achievement Unlocked!
            </p>
            <h4 className="text-lg font-bold text-gray-800 leading-tight">
              {achievement.name}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              {achievement.description}
            </p>
          </div>

          {/* Close */}
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onDismiss, 400);
            }}
            className="relative z-10 text-gray-300 hover:text-gray-500 transition-colors p-1 flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AchievementToast;
