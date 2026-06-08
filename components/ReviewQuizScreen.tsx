import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { VocabularyEntry, QuizQuestion as QuizQuestionType, QuizResult } from '../types';
import { getSharedVocabulary, getWordsDueForReview, updatePracticeRecord } from '../services/vocabularyService';
import { generateQuizQuestions } from '../services/quizService';
import QuizQuestion from './QuizQuestion';

interface ReviewQuizScreenProps {
  currentUser: User;
  onBack: () => void;
  onComplete: (results: QuizResult[]) => void;
}

const ReviewQuizScreen: React.FC<ReviewQuizScreenProps> = ({ currentUser, onBack, onComplete }) => {
  const [vocabulary, setVocabulary] = useState<VocabularyEntry[]>([]);
  const [questions, setQuestions] = useState<QuizQuestionType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    loadQuiz();
  }, [currentUser]);

  const loadQuiz = async () => {
    setIsLoading(true);
    try {
      // Fetch vocabulary — prioritize words due for review
      const [allVocab, dueResult] = await Promise.all([
        getSharedVocabulary(),
        getWordsDueForReview(currentUser.uid),
      ]);
      
      setVocabulary(allVocab);
      setDueCount(dueResult.count);

      // Build quiz pool: due words first, then others to fill
      let quizPool: VocabularyEntry[];
      if (dueResult.words.length >= 4) {
        // Enough due words — use them
        quizPool = dueResult.words.length > 10 
          ? dueResult.words.slice(0, 10) 
          : dueResult.words;
        // But we still need the full pool for distractor generation
      } else {
        // Not enough due words, use all vocabulary
        quizPool = allVocab;
      }

      // Generate questions — pass full vocabulary for distractor generation
      const generatedQuestions = generateQuizQuestions(
        quizPool.length >= 4 ? quizPool : allVocab,
        10,
        allVocab
      );

      if (generatedQuestions.length === 0 && allVocab.length >= 4) {
        // Fallback: try with all vocabulary
        const fallbackQuestions = generateQuizQuestions(allVocab, 10, allVocab);
        setQuestions(fallbackQuestions);
      } else {
        setQuestions(generatedQuestions);
      }
    } catch (error) {
      console.error('Failed to load quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = useCallback((answer: string, isCorrect: boolean, timeTaken: number) => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    const result: QuizResult = {
      question: currentQuestion,
      userAnswer: answer,
      isCorrect,
      timeTaken,
    };

    const newResults = [...results, result];
    setResults(newResults);

    // Update practice record (give score based on correctness)
    const score = isCorrect ? 4 : 2;
    updatePracticeRecord(currentUser.uid, currentQuestion.word, score);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Quiz complete
      setShowSummary(true);
      onComplete(newResults);
    }
  }, [questions, currentIndex, results, currentUser, onComplete]);

  const handleRestart = () => {
    setResults([]);
    setCurrentIndex(0);
    setShowSummary(false);
    loadQuiz();
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8 animate-fade-in-up">
        <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
          <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-6" />
          <h3 className="text-xl font-display font-bold text-gray-800 mb-2">Preparing Your Quiz...</h3>
          <p className="text-gray-500">Loading vocabulary and generating questions</p>
        </div>
      </div>
    );
  }

  // --- Not Enough Words ---
  if (questions.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8 animate-fade-in-up">
        <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            🧠
          </div>
          <h3 className="text-xl font-display font-bold text-gray-800 mb-2">Not Enough Words Yet</h3>
          <p className="text-gray-500 mb-6">
            Add at least 4 words to the vocabulary bank to start a review quiz.
          </p>
          <button
            onClick={onBack}
            className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-full font-bold shadow-md"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // --- Quiz Summary ---
  if (showSummary) {
    const correctCount = results.filter(r => r.isCorrect).length;
    const totalCount = results.length;
    const accuracy = Math.round((correctCount / totalCount) * 100);
    const avgTime = Math.round(results.reduce((sum, r) => sum + r.timeTaken, 0) / totalCount / 1000);

    const getGrade = () => {
      if (accuracy >= 90) return { emoji: '🌟', label: 'Outstanding!', color: 'text-yellow-500' };
      if (accuracy >= 70) return { emoji: '🎯', label: 'Great Job!', color: 'text-green-600' };
      if (accuracy >= 50) return { emoji: '💪', label: 'Keep Going!', color: 'text-blue-600' };
      return { emoji: '📖', label: 'More Practice Needed', color: 'text-orange-600' };
    };

    const grade = getGrade();

    return (
      <div className="w-full max-w-2xl mx-auto mt-8 animate-fade-in-up pb-12">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-brand-100">
          {/* Header */}
          <div className="bg-gradient-to-br from-brand-50 to-white p-8 text-center border-b border-gray-100">
            <div className="text-6xl mb-4">{grade.emoji}</div>
            <h2 className="text-3xl font-display font-bold text-gray-800 mb-2">Quiz Complete!</h2>
            <p className={`text-xl font-bold ${grade.color}`}>{grade.label}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-px bg-gray-100">
            <div className="bg-white p-6 text-center">
              <p className="text-3xl font-black text-brand-600">{correctCount}/{totalCount}</p>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Correct</p>
            </div>
            <div className="bg-white p-6 text-center">
              <p className="text-3xl font-black text-green-600">{accuracy}%</p>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Accuracy</p>
            </div>
            <div className="bg-white p-6 text-center">
              <p className="text-3xl font-black text-purple-600">{avgTime}s</p>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Avg Time</p>
            </div>
          </div>

          {/* Results List */}
          <div className="p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Question Details</h3>
            <div className="space-y-3">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border-2 ${
                    result.isCorrect
                      ? 'border-green-100 bg-green-50/50'
                      : 'border-red-100 bg-red-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        result.isCorrect ? 'bg-green-400 text-white' : 'bg-red-400 text-white'
                      }`}>
                        {result.isCorrect ? '✓' : '✗'}
                      </div>
                      <div>
                        <span className="font-bold text-gray-800">{result.question.word}</span>
                        <span className="text-xs text-gray-400 ml-2">
                          ({result.question.type.replace('-', ' ')})
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 font-bold">
                      {Math.round(result.timeTaken / 1000)}s
                    </span>
                  </div>
                  {!result.isCorrect && (
                    <p className="text-xs text-red-500 mt-2 ml-9">
                      Your answer: <span className="font-bold">{result.userAnswer}</span>
                      {' → '}
                      Correct: <span className="font-bold text-green-600">{result.question.correctAnswer}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRestart}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 px-10 rounded-full shadow-lg transition-all transform hover:scale-105"
          >
            New Quiz
          </button>
          <button
            onClick={onBack}
            className="bg-white border-2 border-gray-200 text-gray-600 font-bold py-4 px-10 rounded-full shadow-sm hover:bg-gray-50 transition-all"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // --- Active Quiz ---
  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  return (
    <div className="w-full mt-8 animate-fade-in-up">
      {/* Progress Bar */}
      <div className="w-full max-w-2xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-brand-600 transition-colors flex items-center gap-1 text-sm font-bold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Exit Quiz
          </button>
          {dueCount > 0 && (
            <span className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
              {dueCount} words due for review
            </span>
          )}
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${(results.length / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Question */}
      <QuizQuestion
        question={currentQuestion}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        onAnswer={handleAnswer}
      />
    </div>
  );
};

export default ReviewQuizScreen;
