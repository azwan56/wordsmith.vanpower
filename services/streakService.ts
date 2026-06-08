/**
 * Streak & Achievement Service
 * 
 * Tracks daily practice streaks and unlockable achievements in Firestore.
 * 
 * Firestore paths:
 *   - users/{userId}/gamification/streak — streak data
 *   - users/{userId}/gamification/achievements — map of achievement IDs to unlock timestamps
 */

import { db } from './firebaseService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { StreakData, Achievement, ALL_ACHIEVEMENTS, BatchResult } from '../types';

// --- Helpers ---

const getToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getYesterday = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// --- Streak Functions ---

const getStreakDocRef = (userId: string) => doc(db, 'users', userId, 'gamification', 'streak');
const getAchievementsDocRef = (userId: string) => doc(db, 'users', userId, 'gamification', 'achievements');

/**
 * Get the current streak data for a user.
 */
export const getStreak = async (userId: string): Promise<StreakData> => {
  try {
    const snap = await getDoc(getStreakDocRef(userId));
    if (snap.exists()) {
      return snap.data() as StreakData;
    }
  } catch (error) {
    console.error('[Streak] Failed to get streak:', error);
  }
  return { current: 0, longest: 0, lastPracticeDate: '' };
};

/**
 * Update the streak after a practice session.
 * Returns the updated streak data.
 */
export const updateStreak = async (userId: string): Promise<StreakData> => {
  try {
    const current = await getStreak(userId);
    const today = getToday();
    const yesterday = getYesterday();

    // Already practiced today — no change
    if (current.lastPracticeDate === today) {
      return current;
    }

    let newStreak: StreakData;

    if (current.lastPracticeDate === yesterday) {
      // Consecutive day — increment streak
      const newCurrent = current.current + 1;
      newStreak = {
        current: newCurrent,
        longest: Math.max(current.longest, newCurrent),
        lastPracticeDate: today,
      };
    } else {
      // Streak broken or first time — start at 1
      newStreak = {
        current: 1,
        longest: Math.max(current.longest, 1),
        lastPracticeDate: today,
      };
    }

    await setDoc(getStreakDocRef(userId), newStreak);
    return newStreak;
  } catch (error) {
    console.error('[Streak] Failed to update streak:', error);
    return { current: 0, longest: 0, lastPracticeDate: '' };
  }
};

// --- Achievement Functions ---

/**
 * Get all achievements for a user (locked + unlocked).
 */
export const getAchievements = async (userId: string): Promise<Achievement[]> => {
  try {
    const snap = await getDoc(getAchievementsDocRef(userId));
    const unlockedMap: Record<string, number> = snap.exists() ? snap.data() as Record<string, number> : {};
    
    return ALL_ACHIEVEMENTS.map(a => ({
      ...a,
      unlockedAt: unlockedMap[a.id] || undefined,
    }));
  } catch (error) {
    console.error('[Achievements] Failed to get achievements:', error);
    return ALL_ACHIEVEMENTS.map(a => ({ ...a }));
  }
};

/**
 * Check and unlock achievements based on current stats.
 * Returns array of NEWLY unlocked achievements (for toasts).
 */
export const checkAndUnlockAchievements = async (
  userId: string,
  stats: {
    totalSessions: number;
    totalWords: number;
    totalStars: number;
    masteredWords: number;  // words with bestScore >= 4
    currentStreak: number;
    latestBatchResults?: BatchResult[];
  }
): Promise<Achievement[]> => {
  try {
    const snap = await getDoc(getAchievementsDocRef(userId));
    const unlockedMap: Record<string, number> = snap.exists() ? snap.data() as Record<string, number> : {};
    
    const newlyUnlocked: Achievement[] = [];
    const now = Date.now();

    // Check each achievement
    const checks: Record<string, boolean> = {
      'first_words': stats.totalSessions >= 1,
      'star_collector': stats.totalStars >= 50,
      'on_fire': stats.currentStreak >= 3,
      'vocab_master': stats.masteredWords >= 25,
      'word_wizard': stats.totalWords >= 100,
      'perfect_session': !!(stats.latestBatchResults && 
        stats.latestBatchResults.length > 0 &&
        stats.latestBatchResults.every(r => r.evaluation.score === 5)),
    };

    for (const [id, condition] of Object.entries(checks)) {
      if (condition && !unlockedMap[id]) {
        unlockedMap[id] = now;
        const achievement = ALL_ACHIEVEMENTS.find(a => a.id === id);
        if (achievement) {
          newlyUnlocked.push({ ...achievement, unlockedAt: now });
        }
      }
    }

    if (newlyUnlocked.length > 0) {
      await setDoc(getAchievementsDocRef(userId), unlockedMap);
    }

    return newlyUnlocked;
  } catch (error) {
    console.error('[Achievements] Failed to check achievements:', error);
    return [];
  }
};
