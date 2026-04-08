import React, { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import { logoutFirebase } from '../services/firebaseService';
import { getAuthDataFromIDB, buildSSOUrl } from '../services/ssoHelper';

interface UserMenuProps {
  user: User | null;
  onOpenAuth: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onOpenAuth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [ssoPayload, setSsoPayload] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Pre-compute SSO payload as soon as user is available.
  // We do this eagerly so that clicking a cross-app link is a plain
  // <a href> navigation — no async involved, no popup blocking.
  useEffect(() => {
    if (!user) {
      setSsoPayload(null);
      return;
    }
    getAuthDataFromIDB().then((data) => {
      if (data && data.length > 0) {
        setSsoPayload(encodeURIComponent(JSON.stringify(data)));
      } else {
        setSsoPayload(null);
      }
    });
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) {
    return (
      <div className="flex gap-2">
        <button
          onClick={onOpenAuth}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full font-bold transition-all shadow-md active:scale-95 text-sm sm:text-base"
        >
          Login / Sign Up
        </button>
      </div>
    );
  }

  let displayName = user.displayName || user.phoneNumber || user.email || 'Scholar';
  if (displayName.length > 15) displayName = displayName.substring(0, 15) + '...';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 bg-white/50 backdrop-blur-sm rounded-full hover:bg-white transition-all outline-none border-2 border-brand-200"
      >
        <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-sm overflow-hidden shadow-inner">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>
        <span className="font-bold text-brand-800 pr-2 hidden md:block text-sm">{displayName}</span>
        <svg className="w-4 h-4 text-brand-800 pr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border-2 border-brand-100 flex-col overflow-hidden z-50">
          <div className="px-4 py-3 bg-brand-50 border-b border-brand-100">
            <p className="text-xs text-brand-600 font-bold uppercase tracking-wider mb-1">My Ecosystem</p>
          </div>

          {/* 
            Cross-app links use pre-computed SSO URLs baked into href.
            Plain <a> navigation — no window.open(), no popup blocking.
          */}
          <a
            href={buildSSOUrl('https://wordsmith.vanpower.live', ssoPayload)}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-4 hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-bold border-b border-slate-100 group"
          >
            <span className="text-tertiary p-2 bg-yellow-100 rounded-lg group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </span>
            MathGenius
          </a>

          <a
            href={buildSSOUrl('https://humanity.vanpower.live', ssoPayload)}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-4 hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-bold border-b border-slate-100 group"
          >
            <span className="text-pink-500 p-2 bg-pink-100 rounded-lg group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            Humanity
          </a>

          <a
            href="https://vanpower.live"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-4 hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-bold border-b border-slate-100 group"
          >
            <span className="text-orange-500 p-2 bg-orange-100 rounded-lg group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </span>
            Vanpower Home
          </a>

          <button
            onClick={logoutFirebase}
            className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold w-full flex justify-center items-center gap-2 mt-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
