import { SessionRecord } from '../types';

const HISTORY_KEY = 'wordsmith_user_history';
const USERS_KEY = 'wordsmith_users';

// User management is now handled by Firebase Auth

// --- Session History Management ---

export const saveSession = (session: SessionRecord): SessionRecord[] => {
  const history = getAllHistory(); // Get raw history
  const updated = [session, ...history];
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save history to localStorage", e);
  }
  return updated.filter(s => s.userId === session.userId); // Return only this user's history
};

// Internal helper to get all records
const getAllHistory = (): SessionRecord[] => {
  try {
    const item = localStorage.getItem(HISTORY_KEY);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.error("Failed to load history from localStorage", e);
    return [];
  }
};

// Public method to get history for a specific user
export const getUserHistory = (userId: string): SessionRecord[] => {
  const all = getAllHistory();
  return all.filter(session => session.userId === userId);
};

export const clearUserHistory = (userId: string): SessionRecord[] => {
    const all = getAllHistory();
    const kept = all.filter(session => session.userId !== userId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(kept));
    return [];
};