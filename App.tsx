import React, { useState, useEffect, useCallback } from 'react';
import WordDisplay from './components/WordDisplay';
import SentenceInput from './components/SentenceInput';
import FeedbackResult from './components/FeedbackResult';
import BatchSummary from './components/BatchSummary';
import StartScreen from './components/StartScreen';
import CustomWordInput from './components/CustomWordInput';
import AuthModal from './components/AuthModal';
import UserMenu from './components/UserMenu';
import { getWordBatch, createCustomBatch, evaluateSentence } from './services/geminiService';
import { saveSession, getUserHistory, clearUserHistory } from './services/storageService';
import { auth } from './services/firebaseService';
import { onAuthStateChanged, User } from 'firebase/auth';
import { WordChallenge, EvaluationResult, BatchResult, SessionRecord } from './types';

const DEFAULT_BATCH_SIZE = 10;

type AppState = 'menu' | 'custom-input' | 'playing' | 'summary';

function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Navigation State
  const [appState, setAppState] = useState<AppState>('menu');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Batch Data State
  const [wordBatch, setWordBatch] = useState<WordChallenge[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);

  // User History State (Specific to logged in user)
  const [history, setHistory] = useState<SessionRecord[]>([]);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // Current step state
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluationResult | null>(null);
  const [currentSentence, setCurrentSentence] = useState("");

  // Listen to Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // When user logs in, load their history
  useEffect(() => {
    if (currentUser) {
      setHistory(getUserHistory(currentUser.uid));
      setAppState('menu'); // Reset to menu on login
    } else {
      setHistory([]);
      setWordBatch([]);
      setBatchResults([]);
    }
  }, [currentUser]);

  // --- App Actions ---

  const goToMenu = () => {
    setAppState('menu');
    setWordBatch([]);
    setBatchResults([]);
    setCurrentIndex(0);
    setCurrentEvaluation(null);
    setCurrentSentence("");
    setIsCustomMode(false);
  };

  const startRandomBatch = async () => {
    setIsLoading(true);
    setIsCustomMode(false);
    // Optimistically switch to playing, but show loading in WordDisplay
    setAppState('playing'); 
    setBatchResults([]);
    setCurrentIndex(0);
    setCurrentEvaluation(null);
    setCurrentSentence("");
    try {
      const batch = await getWordBatch(DEFAULT_BATCH_SIZE);
      setWordBatch(batch);
    } catch (error) {
      console.error("Failed to load batch", error);
      goToMenu(); // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const openCustomInput = () => {
    setAppState('custom-input');
  };

  const handleCustomWordsSubmit = async (words: string[]) => {
    setIsLoading(true);
    try {
      // Keep user on custom-input screen while loading...
      const batch = await createCustomBatch(words);
      if (batch.length > 0) {
        setIsCustomMode(true);
        setWordBatch(batch);
        setBatchResults([]);
        setCurrentIndex(0);
        setCurrentEvaluation(null);
        setCurrentSentence("");
        setAppState('playing');
      }
    } catch (error) {
      console.error("Failed to process custom words", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSentenceSubmit = async (sentence: string) => {
    const currentWord = wordBatch[currentIndex];
    if (!currentWord) return;

    setIsEvaluating(true);
    setCurrentSentence(sentence);
    try {
      const result = await evaluateSentence(currentWord.word, sentence);
      setCurrentEvaluation(result);
      
      // Save result locally (in memory for current batch)
      setBatchResults(prev => [
        ...prev, 
        { 
          wordChallenge: currentWord, 
          userSentence: sentence, 
          evaluation: result 
        }
      ]);

    } catch (error) {
      console.error("Failed to evaluate", error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < wordBatch.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentEvaluation(null);
      setCurrentSentence("");
    } else {
      // Batch Finished - Save to History
      if (currentUser) {
        const newSession: SessionRecord = {
            id: Date.now().toString(),
            userId: currentUser.uid,
            timestamp: Date.now(),
            mode: isCustomMode ? 'custom' : 'random',
            results: batchResults
        };
        
        const updatedHistory = saveSession(newSession);
        setHistory(updatedHistory);
      }
      setAppState('summary');
    }
  };

  const handleClearHistory = () => {
      if (window.confirm("Are you sure you want to clear your practice history? This cannot be undone.") && currentUser) {
          setHistory(clearUserHistory(currentUser.uid));
      }
  };

  // --- Render ---

  // Determine dynamic batch size (could be 10 or custom length)
  const currentBatchSize = wordBatch.length || DEFAULT_BATCH_SIZE;

  return (
    <div className="min-h-screen font-sans flex flex-col bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm z-10 sticky top-0">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={goToMenu} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-display font-bold text-xl shadow-sm">
                W
                </div>
                <h1 className="text-lg font-display font-bold text-gray-800 tracking-tight hidden sm:block">
                WordSmith<span className="text-brand-500">.VanPower</span>
                </h1>
            </button>
            {/* Show UserMenu in nav if logged in */}
            {currentUser && (
                <div className="md:flex items-center gap-2 ml-4">
                    <UserMenu user={currentUser} />
                </div>
            )}
          </div>
          
          {/* Progress Indicator - Only show when playing */}
          {appState === 'playing' && !isLoading && wordBatch.length > 0 ? (
            <div className="flex items-center gap-3">
                <div className="w-24 sm:w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-brand-500 transition-all duration-500 ease-out"
                        style={{ width: `${(batchResults.length / currentBatchSize) * 100}%` }}
                    />
                </div>
                <span className="text-sm font-bold text-gray-400 font-display">
                    {Math.min(batchResults.length + 1, currentBatchSize)}/{currentBatchSize}
                </span>
            </div>
          ) : (
            /* Login Button if not logged in */
            !currentUser ? (
                <button 
                    onClick={() => setShowAuthModal(true)}
                    className="text-sm font-bold text-brand-500 hover:text-brand-600 transition-colors"
                >
                    Login / Sign up
                </button>
            ) : null
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-start">
        
        {!currentUser ? (
             <div className="flex flex-col items-center justify-center mt-20">
                <div className="w-20 h-20 bg-brand-500 rounded-2xl flex items-center justify-center text-white font-display font-bold text-5xl shadow-lg mb-6">
                W
                </div>
                <h2 className="text-3xl font-display font-bold text-gray-800 tracking-tight mb-8">
                  Welcome to WordSmith.VanPower
                </h2>
                <button 
                  onClick={() => setShowAuthModal(true)} 
                  className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-full font-bold shadow-md transition-all transform hover:scale-105"
                >
                  Login to Start Practicing
                </button>
                <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
             </div>
        ) : (
            <>
                {appState === 'menu' && (
                <StartScreen 
                    currentUser={currentUser}
                    onStartRandom={startRandomBatch} 
                    onStartCustom={openCustomInput} 
                    history={history}
                    onClearHistory={handleClearHistory}
                />
                )}

                {appState === 'custom-input' && (
                    <CustomWordInput 
                        onSubmit={handleCustomWordsSubmit} 
                        onCancel={goToMenu}
                        isLoading={isLoading}
                    />
                )}

                {appState === 'summary' && (
                    <BatchSummary 
                        results={batchResults}
                        history={history}
                        onRestart={goToMenu} 
                        isCustomMode={isCustomMode}
                        currentUser={currentUser}
                    />
                )}

                {appState === 'playing' && (
                    <>
                        {/* Word Challenge Card */}
                        <WordDisplay 
                        challenge={wordBatch[currentIndex] || null} 
                        isLoading={isLoading} 
                        onRefresh={startRandomBatch} // Fallback refresh acts as "Try again"
                        currentIndex={currentIndex + 1}
                        totalCount={currentBatchSize}
                        />

                        {/* Interaction Area */}
                        {wordBatch[currentIndex] && !currentEvaluation && (
                        <div className="w-full animate-fade-in-up delay-100">
                            <SentenceInput 
                                onSubmit={handleSentenceSubmit} 
                                isEvaluating={isEvaluating}
                                disabled={isLoading}
                            />
                        </div>
                        )}

                        {/* Results Area */}
                        {currentEvaluation && (
                        <FeedbackResult 
                            result={currentEvaluation} 
                            userSentence={currentSentence}
                            onNext={handleNext}
                            isLastWord={currentIndex === wordBatch.length - 1}
                        />
                        )}
                    </>
                )}
            </>
        )}
        
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-100 py-6 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} WordSmith.VanPower. Powered by Gemini.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;