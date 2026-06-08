/**
 * Shared Vocabulary Service
 * 
 * Uses Firestore to store a shared "Ms. Lindsey" vocabulary bank.
 * All users contribute to and practice from the same word pool.
 * Per-user practice records track individual progress for smart word selection.
 * 
 * Firestore Collections:
 *   - shared_vocabulary: shared word entries (auto-deduplicated)
 *   - shared_vocabulary_batches: batch metadata
 *   - users/{userId}/practice_records: per-user word practice scores
 */

import { db } from './firebaseService';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  addDoc, 
  deleteDoc,
  query, 
  orderBy,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { VocabularyEntry, VocabularyBatch, PracticeRecord, WordChallenge } from '../types';

const SHARED_VOCAB_COL = 'shared_vocabulary';
const SHARED_BATCHES_COL = 'shared_vocabulary_batches';

// --- Shared Vocabulary CRUD ---

/**
 * Get all vocabulary entries from the shared Firestore collection.
 */
export const getSharedVocabulary = async (): Promise<VocabularyEntry[]> => {
  try {
    const q = query(collection(db, SHARED_VOCAB_COL), orderBy('addedAt', 'desc'));
    const snapshot = await getDocs(q);
    console.log(`[Vocabulary] Loaded ${snapshot.docs.length} shared words from Firestore`);
    return snapshot.docs.map(d => ({
      ...(d.data() as VocabularyEntry),
      docId: d.id,
    }));
  } catch (error: any) {
    console.error('[Vocabulary] Failed to load shared vocabulary:', error?.code, error?.message || error);

    // Fallback: if orderBy fails due to missing index, try without ordering
    if (error?.code === 'failed-precondition') {
      console.warn('[Vocabulary] Falling back to unordered query...');
      try {
        const snapshot = await getDocs(collection(db, SHARED_VOCAB_COL));
        const entries = snapshot.docs.map(d => ({
          ...(d.data() as VocabularyEntry),
          docId: d.id,
        }));
        // Sort in memory instead
        entries.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
        console.log(`[Vocabulary] Fallback loaded ${entries.length} words`);
        return entries;
      } catch (fallbackError: any) {
        console.error('[Vocabulary] Fallback query also failed:', fallbackError?.code, fallbackError?.message);
        throw fallbackError;
      }
    }

    // Re-throw so the UI can display a meaningful error instead of showing "empty"
    throw error;
  }
};

/**
 * Get all batch records.
 */
export const getSharedBatches = async (): Promise<VocabularyBatch[]> => {
  try {
    const q = query(collection(db, SHARED_BATCHES_COL), orderBy('addedAt', 'desc'));
    const snapshot = await getDocs(q);
    console.log(`[Vocabulary] Loaded ${snapshot.docs.length} shared batches from Firestore`);
    return snapshot.docs.map(d => ({
      ...(d.data() as VocabularyBatch),
      id: d.id,
    }));
  } catch (error: any) {
    console.error('[Vocabulary] Failed to load shared batches:', error?.code, error?.message || error);
    throw error;
  }
};

/**
 * Add words to the shared vocabulary, auto-deduplicating by word (case-insensitive).
 * Returns only the newly added (non-duplicate) entries.
 */
export const addSharedVocabularyWords = async (
  userId: string,
  userName: string,
  entries: VocabularyEntry[],
  label?: string
): Promise<{ entries: VocabularyEntry[]; batch: VocabularyBatch | null; skippedCount: number }> => {
  try {
    // 1. Fetch existing words to deduplicate
    const existing = await getSharedVocabulary();
    const existingWords = new Set(existing.map(v => v.word.toLowerCase()));

    // 2. Filter out duplicates
    const seen = new Set<string>();
    const newEntries = entries.filter(e => {
      const lower = e.word.toLowerCase();
      if (existingWords.has(lower) || seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });

    const skippedCount = entries.length - newEntries.length;

    if (newEntries.length === 0) {
      return { entries: [], batch: null, skippedCount };
    }

    // 3. Write new entries to Firestore in a batch
    const batch = writeBatch(db);
    const now = Date.now();
    const batchId = now.toString();

    const savedEntries: VocabularyEntry[] = [];
    for (const entry of newEntries) {
      const docRef = doc(collection(db, SHARED_VOCAB_COL));
      const vocabEntry: VocabularyEntry = {
        ...entry,
        addedAt: now,
        batchId,
        addedBy: userId,
        addedByName: userName,
      };
      batch.set(docRef, vocabEntry);
      savedEntries.push({ ...vocabEntry, docId: docRef.id });
    }

    // 4. Save batch record
    const batchDocRef = doc(db, SHARED_BATCHES_COL, batchId);
    const batchRecord: VocabularyBatch = {
      id: batchId,
      userId,
      addedAt: now,
      label: label || `Added by ${userName}`,
      words: newEntries.map(e => e.word),
    };
    batch.set(batchDocRef, batchRecord);

    await batch.commit();

    return { entries: savedEntries, batch: batchRecord, skippedCount };
  } catch (error) {
    console.error('Failed to add shared vocabulary:', error);
    return { entries: [], batch: null, skippedCount: 0 };
  }
};

/**
 * Delete a single word from the shared vocabulary.
 */
export const deleteSharedVocabularyWord = async (docId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, SHARED_VOCAB_COL, docId));
  } catch (error) {
    console.error('Failed to delete vocabulary word:', error);
  }
};

/**
 * Clear ALL shared vocabulary (admin action).
 */
export const clearSharedVocabulary = async (): Promise<void> => {
  try {
    const snapshot = await getDocs(collection(db, SHARED_VOCAB_COL));
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => batch.delete(d.ref));
    
    const batchSnapshot = await getDocs(collection(db, SHARED_BATCHES_COL));
    batchSnapshot.docs.forEach(d => batch.delete(d.ref));
    
    await batch.commit();
  } catch (error) {
    console.error('Failed to clear shared vocabulary:', error);
  }
};


// --- Per-User Practice Records ---

const getPracticeCol = (userId: string) =>
  collection(db, 'users', userId, 'practice_records');

/**
 * Get all practice records for a user.
 */
export const getUserPracticeRecords = async (userId: string): Promise<Map<string, PracticeRecord>> => {
  try {
    const snapshot = await getDocs(getPracticeCol(userId));
    const map = new Map<string, PracticeRecord>();
    snapshot.docs.forEach(d => {
      const data = d.data() as PracticeRecord;
      map.set(d.id, data); // doc ID = lowercase word
    });
    return map;
  } catch (error) {
    console.error('Failed to load practice records:', error);
    return new Map();
  }
};

/**
 * SM-2 inspired SRS calculation.
 * Returns { reviewInterval, easeFactor, nextReviewDate }.
 */
const calculateSRS = (
  score: number,
  prevInterval: number = 1,
  prevEaseFactor: number = 2.5
): { reviewInterval: number; easeFactor: number; nextReviewDate: number } => {
  // Normalize score from 1-5 to 0-5 scale for SM-2
  const q = Math.max(0, score - 0); // score is already 1-5, treat 1 as poor
  
  let newEF = prevEaseFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  newEF = Math.max(1.3, newEF); // EF never drops below 1.3
  
  let newInterval: number;
  if (score <= 2) {
    // Failed — reset to 1 day
    newInterval = 1;
  } else if (prevInterval <= 1) {
    newInterval = 1;
  } else if (prevInterval <= 6) {
    newInterval = 6;
  } else {
    newInterval = Math.round(prevInterval * newEF);
  }
  
  // Cap interval at 180 days
  newInterval = Math.min(newInterval, 180);
  
  const nextReviewDate = Date.now() + newInterval * 24 * 60 * 60 * 1000;
  
  return { reviewInterval: newInterval, easeFactor: newEF, nextReviewDate };
};

export const updatePracticeRecord = async (
  userId: string,
  word: string,
  score: number
): Promise<void> => {
  try {
    const key = word.toLowerCase();
    const docRef = doc(getPracticeCol(userId), key);
    const existing = await getDoc(docRef);

    if (existing.exists()) {
      const data = existing.data() as PracticeRecord;
      const srs = calculateSRS(score, data.reviewInterval || 1, data.easeFactor || 2.5);
      await setDoc(docRef, {
        word: key,
        bestScore: Math.max(data.bestScore, score),
        lastPracticedAt: Date.now(),
        attempts: (data.attempts || 0) + 1,
        reviewInterval: srs.reviewInterval,
        easeFactor: srs.easeFactor,
        nextReviewDate: srs.nextReviewDate,
      });
    } else {
      const srs = calculateSRS(score);
      await setDoc(docRef, {
        word: key,
        bestScore: score,
        lastPracticedAt: Date.now(),
        attempts: 1,
        reviewInterval: srs.reviewInterval,
        easeFactor: srs.easeFactor,
        nextReviewDate: srs.nextReviewDate,
      });
    }
  } catch (error) {
    console.error('Failed to update practice record:', error);
  }
};


// --- Smart Word Selection ---

/**
 * Get words that are due for review (past their nextReviewDate).
 * Returns { count, words } for display on the UI.
 */
export const getWordsDueForReview = async (
  userId: string
): Promise<{ count: number; words: VocabularyEntry[] }> => {
  const [allVocab, practiceRecords] = await Promise.all([
    getSharedVocabulary(),
    getUserPracticeRecords(userId),
  ]);

  const now = Date.now();
  const dueWords: VocabularyEntry[] = [];

  for (const entry of allVocab) {
    const record = practiceRecords.get(entry.word.toLowerCase());
    if (record && record.nextReviewDate && record.nextReviewDate <= now) {
      dueWords.push(entry);
    }
  }

  // Sort by most overdue first
  dueWords.sort((a, b) => {
    const aRecord = practiceRecords.get(a.word.toLowerCase())!;
    const bRecord = practiceRecords.get(b.word.toLowerCase())!;
    return (aRecord.nextReviewDate || 0) - (bRecord.nextReviewDate || 0);
  });

  return { count: dueWords.length, words: dueWords };
};

export const getSmartWordSelection = async (
  userId: string,
  count: number = 10
): Promise<WordChallenge[]> => {
  const [allVocab, practiceRecords] = await Promise.all([
    getSharedVocabulary(),
    getUserPracticeRecords(userId),
  ]);

  if (allVocab.length === 0) return [];

  const now = Date.now();

  // Categorize words with SRS awareness
  const dueForReview: VocabularyEntry[] = [];  // SRS: past nextReviewDate
  const unpracticed: VocabularyEntry[] = [];
  const needsWork: VocabularyEntry[] = [];
  const mastered: VocabularyEntry[] = [];

  for (const entry of allVocab) {
    const record = practiceRecords.get(entry.word.toLowerCase());
    if (!record) {
      unpracticed.push(entry);
    } else if (record.nextReviewDate && record.nextReviewDate <= now) {
      // Due for SRS review — highest priority among practiced words
      dueForReview.push(entry);
    } else if (record.bestScore < 4) {
      needsWork.push(entry);
    } else {
      mastered.push(entry);
    }
  }

  // Shuffle each category
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Build selection: due reviews first, then unpracticed, then needsWork, then mastered
  const prioritized = [
    ...shuffle(dueForReview),
    ...shuffle(unpracticed),
    ...shuffle(needsWork),
    ...shuffle(mastered),
  ];

  const selected = prioritized.slice(0, count);

  // Convert to WordChallenge format
  return selected.map(v => ({
    word: v.word,
    partOfSpeech: v.partOfSpeech,
    definition: v.definition,
    synonyms: v.synonyms,
    antonyms: v.antonyms,
    example: v.example,
  }));
};

/**
 * Get the count of mastered words (bestScore >= 4) for a user.
 */
export const getMasteredWordCount = async (userId: string): Promise<number> => {
  const records = await getUserPracticeRecords(userId);
  let count = 0;
  records.forEach(record => {
    if (record.bestScore >= 4) count++;
  });
  return count;
};
