import React, { useRef, useState } from 'react';
import { BatchResult, SessionRecord } from '../types';
import { User } from 'firebase/auth';
import html2canvas from 'html2canvas';

interface BatchSummaryProps {
  results: BatchResult[];
  history: SessionRecord[];
  onRestart: () => void;
  isCustomMode: boolean;
  currentUser: User;
}

const BatchSummary: React.FC<BatchSummaryProps> = ({ results, history, onRestart, isCustomMode, currentUser }) => {
  const summaryRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const currentTotalStars = results.reduce((acc, curr) => acc + curr.evaluation.score, 0);
  const maxStars = results.length * 5;
  
  // Calculate All-Time Stats
  // Note: 'history' includes the current session because it's updated in App.tsx before rendering Summary
  const allTimeWords = history.reduce((acc, session) => acc + session.results.length, 0);
  const allTimeStars = history.reduce((acc, session) => {
      return acc + session.results.reduce((sAcc, res) => sAcc + res.evaluation.score, 0);
  }, 0);
  const totalSessions = history.length;

  // Find best sentence: Highest score, tie-break by length
  const bestResult = [...results].sort((a, b) => {
    if (b.evaluation.score !== a.evaluation.score) {
      return b.evaluation.score - a.evaluation.score;
    }
    return b.userSentence.length - a.userSentence.length;
  })[0];

  const generateImage = async () => {
    if (!summaryRef.current) return null;
    try {
        const canvas = await html2canvas(summaryRef.current, {
            scale: 2, 
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true,
            windowWidth: 800
        });
        return canvas;
    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
        const canvas = await generateImage();
        if (!canvas) return;

        canvas.toBlob(async (blob) => {
            if (!blob) return;
            const file = new File([blob], "WordSmith-Practice.png", { type: "image/png" });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                     await navigator.share({
                        files: [file],
                        title: 'WordSmith.VanPower Results',
                        text: `I just practiced my vocabulary list on WordSmith.VanPower!`,
                    });
                } catch (err) {
                    if ((err as Error).name !== 'AbortError') {
                        console.error('Share failed', err);
                    }
                }
            } else {
                handleDownloadCanvas(canvas);
            }
        }, 'image/png');
    } catch (e) {
        console.error(e);
    } finally {
        setIsSharing(false);
    }
  };

  const handleDownload = async () => {
      setIsSharing(true);
      const canvas = await generateImage();
      if (canvas) {
          handleDownloadCanvas(canvas);
      }
      setIsSharing(false);
  };

  const handleDownloadCanvas = (canvas: HTMLCanvasElement) => {
      const link = document.createElement('a');
      link.download = 'WordSmith-Practice.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
  };



  return (
    <div className="w-full max-w-2xl mx-auto mt-8 animate-fade-in-up pb-12">
      {/* This div is captured by html2canvas */}
      <div ref={summaryRef} className="bg-white rounded-3xl shadow-xl overflow-hidden text-center p-8 border-4 border-brand-100">
        
        <div className="mb-6">
            <h2 className="text-3xl font-display font-bold text-brand-700 mb-2">Practice Complete!</h2>
            <p className="text-gray-500">
                {isCustomMode ? "Here is how you did on your custom list." : `You've practiced ${results.length} new words.`}
            </p>
        </div>

        {/* Current Session Stats */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 mb-8 border border-yellow-100">
            <p className="text-gray-600 font-bold uppercase tracking-wider text-xs mb-2">Stars Earned Today</p>
            <div className="flex items-center justify-center gap-2">
                <span className="text-5xl font-black text-yellow-500 drop-shadow-sm">{currentTotalStars}</span>
                <span className="text-2xl text-gray-400 font-bold">/ {maxStars}</span>
            </div>
            <div className="flex justify-center mt-2 gap-1">
                 {[1, 2, 3].map(i => (
                     <svg key={i} className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                         <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                     </svg>
                 ))}
            </div>
        </div>

        {/* Best Sentence Highlight */}
        {bestResult && (
            <div className="bg-brand-50 rounded-2xl p-6 mb-8 border border-brand-100 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10 text-brand-500">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.181a1 1 0 011.758 1.06L17.5 6.366V15a1 1 0 01-.5.866l-6.5 3.75a1 1 0 01-1 0l-6.5-3.75A1 1 0 012 15V6.366l-.91 2.508a1 1 0 01-1.76-1.06l1.7-3.182L5 4.323V3a1 1 0 011-1h4z" clipRule="evenodd" /></svg>
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="bg-brand-500 text-white text-xs font-bold px-2 py-1 rounded">Best Performance</span>
                        <span className="text-brand-600 font-bold text-sm">Word: {bestResult.wordChallenge.word}</span>
                    </div>
                    <p className="text-xl font-medium text-gray-800 italic">"{bestResult.userSentence}"</p>
                    <div className="mt-3 flex gap-1">
                        {[...Array(bestResult.evaluation.score)].map((_, i) => (
                             <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* All-Time Statistics Section */}
        <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-200">
            <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-4 border-b border-slate-200 pb-2">Your Career Stats</h3>
            <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                    <p className="text-2xl font-black text-gray-800">{totalSessions}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Sessions</p>
                </div>
                <div className="text-center border-l border-r border-slate-200">
                    <p className="text-2xl font-black text-brand-600">{allTimeWords}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Total Words</p>
                </div>
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                        <p className="text-2xl font-black text-yellow-500">{allTimeStars}</p>
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Career Stars</p>
                </div>
            </div>
        </div>

        {/* List All Sentences */}
        <div className="text-left mb-6">
            <h3 className="text-lg font-bold text-gray-700 mb-4 px-1 border-b pb-2">Batch Details</h3>
            <div className="space-y-4">
                {results.map((result, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-brand-700 bg-brand-100 px-2 py-0.5 rounded text-sm">
                                {result.wordChallenge.word}
                            </span>
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className={`w-3 h-3 ${i < result.evaluation.score ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                        </div>
                        <p className="text-gray-800 text-sm leading-relaxed">"{result.userSentence}"</p>
                        {result.evaluation.correction && (
                            <p className="text-xs text-red-500 mt-2 italic font-medium">Tip: "{result.evaluation.correction}"</p>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* URL Footer for shared images */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center opacity-30">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                WordSmith.VanPower.live
            </p>
        </div>
      </div>



      {/* Action Buttons */}
      <div className="mt-8 flex flex-col gap-4 items-center">
        <button 
          onClick={onRestart}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 px-12 rounded-full transition-all shadow-lg transform hover:scale-105 text-lg w-full sm:w-auto"
        >
          {isCustomMode ? "Back to Menu" : "Start New Batch"}
        </button>

        <div className="flex gap-4 w-full sm:w-auto justify-center">
            <button
                onClick={handleShare}
                disabled={isSharing}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-brand-100 text-brand-600 font-bold rounded-full hover:bg-brand-50 transition-colors shadow-sm disabled:opacity-50"
            >
                {isSharing ? (
                   <span className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                    </svg>
                )}
                Share
            </button>

            <button
                onClick={handleDownload}
                disabled={isSharing}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-100 text-gray-600 font-bold rounded-full hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Save
            </button>
        </div>
      </div>
    </div>
  );
};

export default BatchSummary;