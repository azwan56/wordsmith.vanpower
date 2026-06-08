import React from 'react';
import { Achievement, ALL_ACHIEVEMENTS } from '../types';

interface AchievementsPanelProps {
  achievements: Achievement[];
  onClose: () => void;
}

const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ achievements, onClose }) => {
  const unlockedCount = achievements.filter(a => a.unlockedAt).length;
  const totalCount = ALL_ACHIEVEMENTS.length;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-brand-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h2 className="text-3xl font-display font-bold text-gray-800">
              Achievements
            </h2>
            <p className="text-gray-500">
              {unlockedCount} of {totalCount} unlocked
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-gray-600">Progress</span>
          <span className="text-sm font-bold text-brand-600">{Math.round((unlockedCount / totalCount) * 100)}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {achievements.map((achievement) => {
          const isUnlocked = !!achievement.unlockedAt;
          return (
            <div
              key={achievement.id}
              className={`rounded-2xl p-5 border-2 transition-all ${
                isUnlocked
                  ? 'bg-white border-yellow-200 shadow-md hover:shadow-lg hover:border-yellow-300'
                  : 'bg-gray-50 border-gray-100 opacity-60'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-yellow-100 to-orange-100 shadow-sm'
                      : 'bg-gray-200'
                  }`}
                  style={!isUnlocked ? { filter: 'grayscale(1)' } : {}}
                >
                  {achievement.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-lg leading-tight ${isUnlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                    {achievement.name}
                  </h3>
                  <p className={`text-sm mt-1 ${isUnlocked ? 'text-gray-500' : 'text-gray-400'}`}>
                    {achievement.description}
                  </p>
                  {isUnlocked && achievement.unlockedAt && (
                    <p className="text-xs text-yellow-600 font-bold mt-2 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      Unlocked {formatDate(achievement.unlockedAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementsPanel;
