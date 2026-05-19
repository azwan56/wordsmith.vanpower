import React, { useState, useEffect } from 'react';
import { VocabularyEntry } from '../types';

interface FlashcardDisplayProps {
  vocabulary: VocabularyEntry[];
  onBack: () => void;
}

const FlashcardDisplay: React.FC<FlashcardDisplayProps> = ({ vocabulary, onBack }) => {
  const [currentWord, setCurrentWord] = useState<VocabularyEntry | null>(null);

  useEffect(() => {
    pickRandomWord();
  }, [vocabulary]);

  const pickRandomWord = () => {
    if (vocabulary.length > 0) {
      const randomIndex = Math.floor(Math.random() * vocabulary.length);
      setCurrentWord(vocabulary[randomIndex]);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9; // Slightly slower for better comprehension
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  };

  if (!currentWord) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={onBack}
          className="text-gray-400 hover:text-brand-600 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span className="font-bold">Back to Vocabulary</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden relative">
        <div className="bg-gradient-to-br from-brand-50 to-white p-8 sm:p-12 text-center border-b border-gray-100">
          <h2 className="text-5xl sm:text-6xl font-display font-bold text-gray-800 mb-4 tracking-tight">
            {currentWord.word}
          </h2>
          <div className="flex justify-center items-center gap-4">
            <span className="px-4 py-1 bg-brand-100 text-brand-700 font-bold uppercase tracking-widest text-sm rounded-full">
              {currentWord.partOfSpeech}
            </span>
            <button 
              onClick={() => speakText(currentWord.word)}
              className="w-10 h-10 bg-white border border-gray-200 text-brand-500 rounded-full flex items-center justify-center hover:bg-brand-50 hover:border-brand-300 transition-all shadow-sm"
              title="Listen to word"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.061z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-8 sm:p-12 space-y-8">
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Definition</h3>
            <p className="text-xl text-gray-700">{currentWord.definition}</p>
          </div>

          {(currentWord.synonyms?.length > 0 || currentWord.antonyms?.length > 0) && (
            <div className="grid sm:grid-cols-2 gap-6">
              {currentWord.synonyms?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Synonyms</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentWord.synonyms.map((syn, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {currentWord.antonyms?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Antonyms</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentWord.antonyms.map((ant, idx) => (
                      <span key={idx} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                        {ant}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentWord.example && (
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 relative group">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Example</h3>
              <p className="text-lg text-gray-800 italic pr-12">"{currentWord.example}"</p>
              
              <button 
                onClick={() => speakText(currentWord.example!)}
                className="absolute top-6 right-6 w-10 h-10 bg-white border border-gray-200 text-gray-500 rounded-full flex items-center justify-center hover:bg-brand-50 hover:text-brand-500 hover:border-brand-300 transition-all shadow-sm"
                title="Listen to example"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                  <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.061z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-6 flex justify-center border-t border-gray-100">
          <button
            onClick={pickRandomWord}
            className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-full font-bold shadow-md flex items-center gap-2 transition-transform active:scale-95"
          >
            <span>Next Random Word</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardDisplay;
