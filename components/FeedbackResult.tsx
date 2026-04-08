import React from 'react';
import { EvaluationResult } from '../types';

interface FeedbackResultProps {
  result: EvaluationResult;
  userSentence: string;
  onNext: () => void;
  isLastWord: boolean;
}

const FeedbackResult: React.FC<FeedbackResultProps> = ({ result, userSentence, onNext, isLastWord }) => {
  // Determine color based on score
  const borderColor = result.score >= 4 ? 'border-green-200' : result.score >= 3 ? 'border-amber-200' : 'border-red-200';
  const bgColor = result.score >= 4 ? 'bg-green-50' : result.score >= 3 ? 'bg-amber-50' : 'bg-red-50';

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 animate-fade-in-up">
      <div className={`rounded-2xl border-2 ${borderColor} ${bgColor} overflow-hidden shadow-sm`}>
        {/* Header with Score */}
        <div className="p-6 border-b border-gray-100 bg-white bg-opacity-60 flex items-center justify-between">
            <div>
                <h3 className="text-lg font-bold text-gray-800">Teacher's Feedback</h3>
            </div>
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                        key={star}
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="currentColor" 
                        className={`w-6 h-6 ${star <= result.score ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                ))}
            </div>
        </div>

        <div className="p-6">
            {/* User's Original Sentence */}
            <div className="mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Your Sentence</p>
                <p className="text-xl font-medium text-gray-800 italic">"{userSentence}"</p>
            </div>

            {/* Main Feedback */}
            <p className="text-gray-700 leading-relaxed mb-4 text-lg">
                {result.feedback}
            </p>

            {/* Corrections (if any) */}
            {result.correction && (
                <div className="mb-4 p-4 bg-white rounded-lg border-l-4 border-red-400 shadow-sm">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1">Better Grammar</p>
                    <p className="text-gray-800 font-medium">"{result.correction}"</p>
                </div>
            )}

            {/* AI Examples */}
            <div className="mt-8">
                <p className="text-sm font-bold text-brand-600 uppercase tracking-wide mb-3">
                    Pro Examples
                </p>
                <div className="space-y-3">
                    {result.betterExamples.map((ex, i) => (
                        <div key={i} className="flex gap-3 items-start bg-white p-3 rounded-lg border border-brand-100 shadow-sm">
                            <span className="flex-shrink-0 w-6 h-6 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                                {i + 1}
                            </span>
                            <p className="text-gray-700">{ex}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="flex justify-center my-6">
            <button
                onClick={onNext}
                className="group bg-brand-600 hover:bg-brand-700 text-white text-lg font-bold py-3 px-10 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
            >
                {isLastWord ? "See Batch Results" : "Next Word"}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
            </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackResult;