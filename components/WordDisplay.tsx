import React from 'react';
import { WordChallenge } from '../types';

interface WordDisplayProps {
  challenge: WordChallenge | null;
  isLoading: boolean;
  onRefresh: () => void;
  currentIndex: number;
  totalCount: number;
}

const WordDisplay: React.FC<WordDisplayProps> = ({ challenge, isLoading, onRefresh, currentIndex, totalCount }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-2xl mx-auto text-center animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-6"></div>
        <div className="h-16 bg-gray-100 rounded w-full mb-4"></div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-display text-gray-700 mb-4">Ready to write?</h2>
        <button 
          onClick={onRefresh}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-8 rounded-full transition-all shadow-md transform hover:scale-105"
        >
          Start Challenge
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl mx-auto relative overflow-hidden border-t-4 border-brand-500">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.25 4.533A9.707 9.707 0 006 3.75c-3.75 0-6.75 3-6.75 6.75 0 1.875 1.11 3.529 2.76 4.46a25.247 25.247 0 01-.76 4.54l-1.5 1.5 1.06 1.06 1.5-1.5c1.458-1.458 2.754-3.5 3.515-5.592l.06-.17c.577-1.706 1.824-2.82 3.365-2.82.72 0 1.306.242 1.76.71a4.42 4.42 0 00-1.005-2.905zm7.49-1.293a.75.75 0 00-1.06 1.06l1.5 1.5-1.5 1.5a.75.75 0 101.06 1.06l1.5-1.5 1.5 1.5a.75.75 0 001.06-1.06l-1.5-1.5 1.5-1.5a.75.75 0 00-1.06-1.06l-1.5 1.5-1.5-1.5z" />
        </svg>
      </div>

      <div className="absolute top-4 left-4">
        <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Word {currentIndex} of {totalCount}
        </span>
      </div>

      <div className="flex flex-col items-center">
        <span className="inline-block bg-brand-100 text-brand-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
          {challenge.partOfSpeech}
        </span>
        <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-800 mb-2 tracking-tight">
          {challenge.word}
        </h2>
        
        <p className="text-gray-600 text-lg text-center mb-6 leading-relaxed max-w-lg">
          {challenge.definition}
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {challenge.synonyms.map((syn, idx) => (
            <span key={idx} className="text-gray-400 text-sm italic">
              {syn}{idx < challenge.synonyms.length - 1 ? " • " : ""}
            </span>
          ))}
        </div>

        <button 
          onClick={onRefresh}
          className="text-gray-400 hover:text-brand-600 text-sm font-medium transition-colors flex items-center gap-1 mt-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Skip this word
        </button>
      </div>
    </div>
  );
};

export default WordDisplay;