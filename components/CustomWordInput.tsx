import React, { useState } from 'react';

interface CustomWordInputProps {
  onSubmit: (words: string[]) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const CustomWordInput: React.FC<CustomWordInputProps> = ({ onSubmit, onCancel, isLoading }) => {
  const [inputText, setInputText] = useState("");

  const handleSubmit = () => {
    // Split by commas, newlines, or spaces (handling multiple spaces)
    const rawWords = inputText.split(/[\n,]+/).map(w => w.trim()).filter(w => w.length > 0);
    
    // De-duplicate
    const uniqueWords = Array.from(new Set(rawWords));

    if (uniqueWords.length > 0) {
      onSubmit(uniqueWords);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 bg-white p-8 rounded-3xl shadow-xl animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display font-bold text-gray-800">
          Paste Your Words
        </h2>
        <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
      </div>

      <p className="text-gray-600 mb-4">
        Enter the words you want to practice below. You can separate them with commas or new lines.
      </p>

      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        disabled={isLoading}
        placeholder="e.g. apple, banana, curiosity, brave"
        className="w-full h-48 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:ring-0 focus:outline-none text-lg resize-none shadow-sm transition-all mb-6 placeholder-gray-400 text-black"
      />

      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-6 py-3 rounded-full font-bold text-gray-500 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading || !inputText.trim()}
          className={`
            px-8 py-3 rounded-full font-bold text-white transition-all shadow-md flex items-center gap-2
            ${isLoading || !inputText.trim() 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-brand-600 hover:bg-brand-700 hover:scale-105'}
          `}
        >
          {isLoading ? (
            <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Preparing...
            </>
          ) : (
             "Start Practice" 
          )}
        </button>
      </div>
    </div>
  );
};

export default CustomWordInput;