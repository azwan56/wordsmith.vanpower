import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion as QuizQuestionType } from '../types';

interface QuizQuestionProps {
  question: QuizQuestionType;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: string, isCorrect: boolean, timeTaken: number) => void;
}

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  'synonym': { label: 'Synonym Match', color: 'text-blue-700', bg: 'bg-blue-100' },
  'antonym': { label: 'Antonym Match', color: 'text-red-700', bg: 'bg-red-100' },
  'definition': { label: 'Definition Match', color: 'text-purple-700', bg: 'bg-purple-100' },
  'fill-blank': { label: 'Fill in the Blank', color: 'text-green-700', bg: 'bg-green-100' },
};

const QuizQuestion: React.FC<QuizQuestionProps> = ({ question, questionNumber, totalQuestions, onAnswer }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [fillInput, setFillInput] = useState('');
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const startTime = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null);
    setFillInput('');
    setAnswered(false);
    setIsCorrect(false);
    startTime.current = Date.now();
    if (question.type === 'fill-blank' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [question]);

  const handleSubmit = (answer: string) => {
    if (answered) return;
    
    const timeTaken = Date.now() - startTime.current;
    const normalizedAnswer = answer.trim().toLowerCase();
    const normalizedCorrect = question.correctAnswer.trim().toLowerCase();
    
    let correct = false;
    if (question.type === 'fill-blank') {
      correct = normalizedAnswer === normalizedCorrect;
    } else {
      correct = normalizedAnswer === normalizedCorrect;
    }
    
    setAnswered(true);
    setIsCorrect(correct);
    setSelectedOption(answer);
    
    // Delay before proceeding to next question
    setTimeout(() => {
      onAnswer(answer, correct, timeTaken);
    }, 2200);
  };

  const handleFillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fillInput.trim()) {
      handleSubmit(fillInput.trim());
    }
  };

  const typeInfo = TYPE_LABELS[question.type] || TYPE_LABELS['definition'];

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Question Header */}
      <div className="flex items-center justify-between mb-6">
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${typeInfo.bg} ${typeInfo.color}`}>
          {typeInfo.label}
        </span>
        <span className="text-sm font-bold text-gray-400">
          {questionNumber} / {totalQuestions}
        </span>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Prompt */}
        <div className="p-8 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
          <p className="text-xl sm:text-2xl font-display font-bold text-gray-800 text-center leading-relaxed whitespace-pre-line">
            {question.prompt}
          </p>
        </div>

        {/* Options or Input */}
        <div className="p-6 sm:p-8">
          {question.type === 'fill-blank' ? (
            /* Fill-in-the-blank Input */
            <form onSubmit={handleFillSubmit} className="space-y-4">
              <input
                ref={inputRef}
                type="text"
                value={fillInput}
                onChange={(e) => setFillInput(e.target.value)}
                disabled={answered}
                placeholder="Type your answer..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                className={`w-full text-center text-2xl font-display font-bold py-4 px-6 rounded-2xl border-2 outline-none transition-all ${
                  answered
                    ? isCorrect
                      ? 'border-green-400 bg-green-50 text-green-700'
                      : 'border-red-400 bg-red-50 text-red-700'
                    : 'border-gray-200 focus:border-brand-400 bg-gray-50'
                }`}
              />
              {!answered && (
                <button
                  type="submit"
                  disabled={!fillInput.trim()}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Check Answer
                </button>
              )}
            </form>
          ) : (
            /* Multiple Choice Options */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {question.options?.map((option, idx) => {
                let optionStyle = 'bg-white border-gray-200 hover:border-brand-300 hover:bg-brand-50 hover:shadow-md cursor-pointer';
                
                if (answered) {
                  const isThisCorrect = option.toLowerCase() === question.correctAnswer.toLowerCase();
                  const isThisSelected = option === selectedOption;
                  
                  if (isThisCorrect) {
                    optionStyle = 'bg-green-50 border-green-400 shadow-md ring-2 ring-green-200';
                  } else if (isThisSelected && !isThisCorrect) {
                    optionStyle = 'bg-red-50 border-red-400 shadow-md ring-2 ring-red-200';
                  } else {
                    optionStyle = 'bg-gray-50 border-gray-100 opacity-50';
                  }
                }
                
                return (
                  <button
                    key={idx}
                    onClick={() => handleSubmit(option)}
                    disabled={answered}
                    className={`p-4 rounded-2xl border-2 text-left font-bold text-gray-700 transition-all ${optionStyle} ${
                      answered ? 'cursor-default' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        answered && option.toLowerCase() === question.correctAnswer.toLowerCase()
                          ? 'bg-green-400 text-white'
                          : answered && option === selectedOption
                          ? 'bg-red-400 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-base">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Feedback Section (shown after answering) */}
        {answered && (
          <div className={`p-6 border-t-2 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} animate-fade-in-up`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                isCorrect ? 'bg-green-400 text-white' : 'bg-red-400 text-white'
              }`}>
                {isCorrect ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`font-bold text-lg ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {isCorrect ? 'Correct! 🎉' : 'Not quite!'}
                </p>
                {!isCorrect && question.type === 'fill-blank' && (
                  <p className="text-red-600 font-bold mt-1">
                    The answer is: <span className="underline">{question.correctAnswer}</span>
                  </p>
                )}
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                  {question.explanation}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizQuestion;
