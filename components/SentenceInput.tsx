import React, { useState } from 'react';

interface SentenceInputProps {
  onSubmit: (sentence: string) => void;
  isEvaluating: boolean;
  disabled: boolean;
}

const SentenceInput: React.FC<SentenceInputProps> = ({ onSubmit, isEvaluating, disabled }) => {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text);
      setText(""); // Optionally clear, but maybe we want to keep it if they want to edit? Let's clear for now.
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim() && !disabled && !isEvaluating) {
        onSubmit(text);
        setText("");
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-6">
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isEvaluating}
          placeholder={disabled ? "Generating word..." : "Write your creative sentence here..."}
          className="w-full h-32 p-4 pr-16 bg-white border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:ring-0 focus:outline-none text-lg resize-none shadow-sm transition-all text-black disabled:bg-gray-50 disabled:text-gray-400 placeholder-gray-400"
        />
        
        <div className="absolute bottom-4 right-4">
          <button
            type="submit"
            disabled={!text.trim() || disabled || isEvaluating}
            className={`
              flex items-center justify-center w-10 h-10 rounded-full shadow-md transition-all
              ${!text.trim() || disabled || isEvaluating 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-brand-500 text-white hover:bg-brand-600 hover:scale-110 active:scale-95'
              }
            `}
            title="Submit Sentence"
          >
             {isEvaluating ? (
               <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
             ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
             )}
          </button>
        </div>
      </form>
      <p className="text-center text-gray-400 text-sm mt-2">
        Press <strong>Enter</strong> to submit
      </p>
    </div>
  );
};

export default SentenceInput;