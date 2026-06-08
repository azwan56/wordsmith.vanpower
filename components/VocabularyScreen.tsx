import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { VocabularyEntry, WordChallenge } from '../types';
import { getSharedVocabulary, deleteSharedVocabularyWord, clearSharedVocabulary, addSharedVocabularyWords, getSmartWordSelection, getWordsDueForReview } from '../services/vocabularyService';
import { createCustomBatch } from '../services/geminiService';
import FlashcardDisplay from './FlashcardDisplay';

interface VocabularyScreenProps {
  currentUser: User;
  onBack: () => void;
  onStartPractice: (words: WordChallenge[], mode: 'vocabulary') => void;
  onOpenReviewQuiz: () => void;
}

const VocabularyScreen: React.FC<VocabularyScreenProps> = ({ currentUser, onBack, onStartPractice, onOpenReviewQuiz }) => {
  const [vocabulary, setVocabulary] = useState<VocabularyEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFlashcardMode, setIsFlashcardMode] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    loadVocabulary();
  }, [currentUser]);

  const loadVocabulary = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const vocab = await getSharedVocabulary();
      setVocabulary(vocab);
      
      const dueResult = await getWordsDueForReview(currentUser.uid);
      setDueCount(dueResult.count);
    } catch (error: any) {
      console.error('[VocabularyScreen] Error loading vocabulary:', error);
      const code = error?.code || '';
      if (code === 'permission-denied') {
        setLoadError('Permission denied. Please make sure you are logged in and try again.');
      } else if (code === 'failed-precondition') {
        setLoadError('Database index required. Please contact the administrator.');
      } else if (code === 'unavailable' || code === 'deadline-exceeded') {
        setLoadError('Network issue. Please check your connection and try again.');
      } else {
        setLoadError(`Failed to load vocabulary: ${error?.message || 'Unknown error'}. Tap retry to try again.`);
      }
      setVocabulary([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWords = async () => {
    const rawWords = inputText.split(/[\n,]+/).map(w => w.trim()).filter(w => w.length > 0);
    const uniqueWords = Array.from(new Set<string>(rawWords));
    
    if (uniqueWords.length === 0) return;

    setIsLoading(true);
    try {
      const batch = await createCustomBatch(uniqueWords);
      if (batch.length > 0) {
        // Convert to VocabularyEntry
        const entries: VocabularyEntry[] = batch.map(b => ({
          ...b,
          addedAt: Date.now(),
          batchId: '', // Will be set by storage service
        }));
        await addSharedVocabularyWords(currentUser.uid, currentUser.displayName || 'Scholar', entries, `Added ${new Date().toLocaleDateString()}`);
        await loadVocabulary();
        setInputText("");
        setIsAdding(false);
      }
    } catch (error) {
      console.error("Failed to add words", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (word: string, docId?: string) => {
    if (!docId) return;
    if (window.confirm(`Remove "${word}" from the shared vocabulary?`)) {
      await deleteSharedVocabularyWord(docId);
      await loadVocabulary();
    }
  };

  const handleClear = async () => {
    if (window.confirm("Are you sure you want to clear ALL shared vocabulary? This affects all users.")) {
      await clearSharedVocabulary();
      await loadVocabulary();
    }
  };

  const startSmartPractice = async () => {
    if (vocabulary.length === 0) return;
    setIsLoading(true);
    const selected = await getSmartWordSelection(currentUser.uid, 10);
    setIsLoading(false);
    onStartPractice(selected, 'vocabulary');
  };

  if (isFlashcardMode) {
    return <FlashcardDisplay vocabulary={vocabulary} onBack={() => setIsFlashcardMode(false)} />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="text-gray-400 hover:text-brand-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h2 className="text-3xl font-display font-bold text-gray-800">
              Ms. Lindsey's Vocabulary
            </h2>
            <p className="text-gray-500">{isLoading ? 'Loading...' : `${vocabulary.length} words in the shared bank`}</p>
          </div>
        </div>
        <div className="flex gap-2">
           {vocabulary.length > 0 && (
             <button onClick={handleClear} className="text-sm font-bold text-red-500 hover:text-red-700 px-4 py-2">
               Clear All
             </button>
           )}
           <button 
             onClick={() => setIsAdding(!isAdding)}
             className="bg-brand-100 text-brand-600 hover:bg-brand-200 px-4 py-2 rounded-full font-bold transition-colors flex items-center gap-2"
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
             </svg>
             Add Words
           </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-3xl shadow-md border-2 border-brand-100 mb-8">
          <h3 className="font-bold text-gray-800 mb-2">Add New Words</h3>
          <p className="text-sm text-gray-500 mb-4">Separate words with commas or new lines.</p>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            className="w-full h-32 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none resize-none mb-4"
            placeholder="e.g. subtle, immense, peculiar"
          />
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setIsAdding(false)} 
              disabled={isLoading}
              className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-full font-bold"
            >
              Cancel
            </button>
            <button 
              onClick={handleAddWords}
              disabled={isLoading || !inputText.trim()}
              className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-full font-bold shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? "Adding..." : "Add to Vocabulary"}
            </button>
          </div>
        </div>
      )}

      {vocabulary.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={startSmartPractice}
            disabled={isLoading}
            className="bg-white p-6 rounded-3xl shadow-sm border-2 border-transparent hover:border-brand-200 hover:shadow-md transition-all text-left flex flex-col items-start gap-4 group disabled:opacity-50 relative"
          >
            {dueCount > 0 && (
              <span className="absolute top-4 right-4 bg-orange-100 text-orange-600 font-bold text-xs px-2 py-1 rounded-full animate-pulse border border-orange-200 shadow-sm">
                {dueCount} Due
              </span>
            )}
            <div className="bg-brand-100 text-brand-600 p-4 rounded-2xl group-hover:scale-110 transition-transform">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
               </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Smart Practice</h3>
              <p className="text-gray-500 text-sm mt-1">Write sentences. Focuses on weak words and new additions.</p>
            </div>
          </button>

          <button
            onClick={() => setIsFlashcardMode(true)}
            className="bg-white p-6 rounded-3xl shadow-sm border-2 border-transparent hover:border-accent-200 hover:shadow-md transition-all text-left flex flex-col items-start gap-4 group"
          >
            <div className="bg-accent-light text-accent-dark p-4 rounded-2xl group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Word Explanation</h3>
              <p className="text-gray-500 text-sm mt-1">Flashcards with meaning, TTS and examples.</p>
            </div>
          </button>

          <button
            onClick={onOpenReviewQuiz}
            className="bg-white p-6 rounded-3xl shadow-sm border-2 border-transparent hover:border-orange-200 hover:shadow-md transition-all text-left flex flex-col items-start gap-4 group"
          >
            <div className="bg-orange-100 text-orange-600 p-4 rounded-2xl group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Review Quiz</h3>
              <p className="text-gray-500 text-sm mt-1">Test your memory with interactive quizzes.</p>
            </div>
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && vocabulary.length === 0 && !loadError && (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500">Loading shared vocabulary...</p>
        </div>
      )}

      {/* Error State */}
      {loadError && (
        <div className="bg-white p-12 rounded-3xl shadow-sm border-2 border-red-100 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Could Not Load Vocabulary</h3>
          <p className="text-red-500 text-sm mb-6 max-w-md">{loadError}</p>
          <button 
            onClick={loadVocabulary}
            className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-full font-bold shadow-md flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            Retry
          </button>
        </div>
      )}

      {/* Empty State - only show if not loading and no error */}
      {!isLoading && !loadError && vocabulary.length === 0 && !isAdding && (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col items-center">
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
           </div>
           <h3 className="text-xl font-bold text-gray-800 mb-2">Vocabulary Bank is Empty</h3>
           <p className="text-gray-500 mb-6">No words have been added yet. Start building the shared vocabulary list!</p>
           <button 
             onClick={() => setIsAdding(true)}
             className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-full font-bold shadow-md"
           >
             Add First Words
           </button>
        </div>
      )}

      {/* Word List */}
      {!loadError && vocabulary.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <h4 className="font-bold text-gray-700">All Words ({vocabulary.length})</h4>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {vocabulary.map((entry, idx) => (
              <div key={idx} className="p-4 sm:px-6 flex justify-between items-center hover:bg-gray-50 transition-colors group">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-lg text-gray-800">{entry.word}</span>
                    <span className="text-xs font-medium text-brand-600 uppercase tracking-wider">{entry.partOfSpeech}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{entry.definition}</p>
                  {entry.addedByName && (
                    <p className="text-xs text-gray-400 mt-1">Added by: {entry.addedByName}</p>
                  )}
                </div>
                <button 
                  onClick={() => handleDelete(entry.word, entry.docId)}
                  className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"
                  title="Remove word"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VocabularyScreen;
