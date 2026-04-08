import React from 'react';
import { SessionRecord } from '../types';
import { User } from 'firebase/auth';

interface StartScreenProps {
  currentUser: User;
  onStartRandom: () => void;
  onStartCustom: () => void;
  history: SessionRecord[];
  onClearHistory: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ currentUser, onStartRandom, onStartCustom, history, onClearHistory }) => {

  // Calculate Stats
  const totalSessions = history.length;
  const totalWords = history.reduce((acc, session) => acc + session.results.length, 0);
  const totalStars = history.reduce((acc, session) => {
      return acc + session.results.reduce((sAcc, res) => sAcc + res.evaluation.score, 0);
  }, 0);
  
  // Format Date
  const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
      });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center animate-fade-in-up">
      <div className="text-center mb-10">
        <div className="inline-block px-4 py-1.5 bg-brand-50 rounded-full text-brand-600 font-bold text-sm mb-4">
            Welcome back, {currentUser.displayName || 'Wordsmith'}!
        </div>
        <h2 className="text-3xl font-display font-bold text-gray-800 mb-4">
          Ready to Write?
        </h2>
        <p className="text-xl text-gray-600 max-w-lg mx-auto">
          Expand your vocabulary and become a master storyteller. 
          How would you like to practice today?
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl mb-16">
        {/* Random Batch Option */}
        <button
          onClick={onStartRandom}
          className="group relative bg-white p-8 rounded-3xl shadow-lg border-2 border-transparent hover:border-brand-200 hover:shadow-xl transition-all text-left flex flex-col items-start overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <svg className="w-32 h-32 text-brand-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14.707 13.293a1 1 0 01-1.414 0L10 10.086 6.707 13.38a1 1 0 01-1.414-1.415l4-4a1 1 0 011.414 0l3.293 3.293a1 1 0 010 1.415z" /></svg>
          </div>
          <div className="bg-brand-100 p-3 rounded-2xl mb-4 text-brand-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Random Batch</h3>
          <p className="text-gray-500 mb-6">
            Practice 10 random words from our curated dictionary designed for your age group.
          </p>
          <span className="mt-auto font-bold text-brand-600 flex items-center gap-1 group-hover:gap-2 transition-all">
            Start Now 
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </button>

        {/* Custom Input Option */}
        <button
          onClick={onStartCustom}
          className="group relative bg-white p-8 rounded-3xl shadow-lg border-2 border-transparent hover:border-accent-200 hover:shadow-xl transition-all text-left flex flex-col items-start overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <svg className="w-32 h-32 text-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
          </div>
          <div className="bg-accent-light p-3 rounded-2xl mb-4 text-accent-dark">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">My Own Words</h3>
          <p className="text-gray-500 mb-6">
            Paste a list of words from school or your homework. We'll help you create sentences for them.
          </p>
          <span className="mt-auto font-bold text-accent-dark flex items-center gap-1 group-hover:gap-2 transition-all">
            Create List
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </button>
      </div>

      {/* User History Section */}
      <div className="w-full max-w-3xl animate-fade-in-up flex flex-col items-center">
            <div className="w-full">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-display font-bold text-gray-800 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-brand-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        Your Writer Profile
                    </h3>
                    {history.length > 0 && (
                        <button onClick={onClearHistory} className="text-xs text-red-400 hover:text-red-600 font-bold underline">
                            Clear My History
                        </button>
                    )}
                </div>

                {history.length === 0 ? (
                     <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-400">
                        <p>No practice history yet. Start a batch to see your stats!</p>
                     </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Sessions</p>
                                <p className="text-3xl font-black text-gray-800">{totalSessions}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Words Written</p>
                                <p className="text-3xl font-black text-brand-600">{totalWords}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Total Stars</p>
                                <div className="flex items-center justify-center gap-1">
                                    <p className="text-3xl font-black text-yellow-500">{totalStars}</p>
                                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Recent History List */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                                <h4 className="text-sm font-bold text-gray-600">Recent Activity</h4>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {history.slice(0, 5).map((session) => (
                                    <div key={session.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${session.mode === 'random' ? 'bg-brand-100 text-brand-600' : 'bg-accent-light text-accent-dark'}`}>
                                                {session.mode === 'random' ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">
                                                    {session.results.length} Words Practiced
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {formatDate(session.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                                            <span className="font-bold text-yellow-600 text-sm">
                                                {session.results.reduce((acc, r) => acc + r.evaluation.score, 0)}
                                            </span>
                                            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
      </div>
    </div>
  );
};

export default StartScreen;