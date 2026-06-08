import React from 'react';
import { StreakData } from '../types';

interface StreakBadgeProps {
  streak: StreakData;
}

const StreakBadge: React.FC<StreakBadgeProps> = ({ streak }) => {
  if (streak.current <= 0) return null;

  return (
    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-red-100 border border-orange-200 rounded-full px-4 py-2 shadow-sm">
      <span className="text-2xl animate-bounce" style={{ animationDuration: '2s' }}>🔥</span>
      <div className="flex flex-col">
        <span className="text-sm font-black text-orange-700 leading-none">
          {streak.current} Day{streak.current !== 1 ? 's' : ''}
        </span>
        <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider leading-none mt-0.5">
          Streak
        </span>
      </div>
      {streak.current >= 3 && (
        <span className="text-xs font-bold text-orange-500 ml-1">
          {streak.current >= 7 ? '🌟' : '✨'}
        </span>
      )}
    </div>
  );
};

export default StreakBadge;
