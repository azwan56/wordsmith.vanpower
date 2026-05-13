import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { VocabularyEntry, WordChallenge } from '../types';
import { getUserVocabulary, deleteVocabularyWord, clearUserVocabulary, addVocabularyWords, getUserVocabBatches } from '../services/storageService';
import { createCustomBatch } from '../services/geminiService';

interface VocabularyScreenProps {
  currentUser: User;
  onBack: () => void;
  onStartPractice: (words: WordChallenge[], mode: 'vocabulary') => void;
}

const VocabularyScreen: React.FC<VocabularyScreenProps> = ({ currentUser, onBack, onStartPractice }) => {
  const [vocabulary, setVocabulary] = useState<VocabularyEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadVocabulary();
  }, [currentUser]);

  const loadVocabulary = () => {
    setVocabulary(getUserVocabulary(currentUser.uid));
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
        addVocabularyWords(currentUser.uid, entries, `Added ${new Date().toLocaleDateString()}`);
        loadVocabulary();
        setInputText("");
        setIsAdding(false);
      }
    } catch (error) {
      console.error("Failed to add words", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (word: string) => {
    if (window.confirm(`Remove "${word}" from your vocabulary?`)) {
      setVocabulary(deleteVocabularyWord(currentUser.uid, word));
    }
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear your entire vocabulary?")) {
      clearUserVocabulary(currentUser.uid);
      loadVocabulary();
    }
  };

  const startRandom10 = () => {
    if (vocabulary.length === 0) return;
    const array = [...vocabulary];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    const selected = array.slice(0, 10).map(v => ({
      word: v.word,
      partOfSpeech: v.partOfSpeech,
      definition: v.definition,
      synonyms: v.synonyms
    }));
    onStartPractice(selected, 'vocabulary');
  };

  const startLatestBatch = () => {
    const batches = getUserVocabBatches(currentUser.uid);
    if (batches.length === 0) return;
    // Get the most recent batch
    const latestBatch = batches.reduce((latest, current) => 
      current.addedAt > latest.addedAt ? current : latest
    , batches[0]);

    const wordsInLatestBatch = vocabulary.filter(v => v.batchId === latestBatch.id);
    if (wordsInLatestBatch.length === 0) return;

    const selected = wordsInLatestBatch.map(v => ({
      word: v.word,
      partOfSpeech: v.partOfSpeech,
      definition: v.definition,
      synonyms: v.synonyms
    }));
    onStartPractice(selected, 'vocabulary');
  };

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
            <p className="text-gray-500">You have {vocabulary.length} words in your bank.</p>
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
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={startRandom10}
            className="bg-white p-6 rounded-3xl shadow-sm border-2 border-transparent hover:border-brand-200 hover:shadow-md transition-all text-left flex items-center gap-4 group"
          >
            <div className="bg-brand-100 text-brand-600 p-4 rounded-2xl group-hover:scale-110 transition-transform">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
               </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Practice Random 10</h3>
              <p className="text-gray-500 text-sm">Review a random mix from your bank.</p>
            </div>
          </button>

          <button
            onClick={startLatestBatch}
            className="bg-white p-6 rounded-3xl shadow-sm border-2 border-transparent hover:border-accent-200 hover:shadow-md transition-all text-left flex items-center gap-4 group"
          >
            <div className="bg-accent-light text-accent-dark p-4 rounded-2xl group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Practice Latest Batch</h3>
              <p className="text-gray-500 text-sm">Focus on the words you just added.</p>
            </div>
          </button>
        </div>
      )}

      {vocabulary.length === 0 && !isAdding ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col items-center">
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
           </div>
           <h3 className="text-xl font-bold text-gray-800 mb-2">Your Bank is Empty</h3>
           <p className="text-gray-500 mb-6">Start building your personal vocabulary list.</p>
           <button 
             onClick={() => setIsAdding(true)}
             className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-full font-bold shadow-md"
           >
             Add First Words
           </button>
        </div>
      ) : (
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
                </div>
                <button 
                  onClick={() => handleDelete(entry.word)}
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
