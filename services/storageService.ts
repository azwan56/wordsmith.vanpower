import { SessionRecord, VocabularyEntry, VocabularyBatch } from '../types';

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

// --- Vocabulary Management ---

const VOCABULARY_KEY = 'wordsmith_vocabulary';
const VOCAB_BATCHES_KEY = 'wordsmith_vocab_batches';

const getAllVocabulary = (): VocabularyEntry[] => {
  try {
    const item = localStorage.getItem(VOCABULARY_KEY);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.error("Failed to load vocabulary from localStorage", e);
    return [];
  }
};

const getAllVocabBatches = (): VocabularyBatch[] => {
  try {
    const item = localStorage.getItem(VOCAB_BATCHES_KEY);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.error("Failed to load vocab batches from localStorage", e);
    return [];
  }
};

export const getUserVocabulary = (userId: string): VocabularyEntry[] => {
  // Vocabulary is shared per-device (not per user), but we can filter by batch userId
  const batches = getAllVocabBatches().filter(b => b.userId === userId);
  const batchIds = new Set(batches.map(b => b.id));
  return getAllVocabulary().filter(v => batchIds.has(v.batchId));
};

export const getUserVocabBatches = (userId: string): VocabularyBatch[] => {
  return getAllVocabBatches().filter(b => b.userId === userId);
};

export const addVocabularyWords = (
  userId: string,
  entries: VocabularyEntry[],
  label?: string
): { entries: VocabularyEntry[]; batch: VocabularyBatch } => {
  const batchId = Date.now().toString();
  const timestampedEntries = entries.map(e => ({
    ...e,
    addedAt: Date.now(),
    batchId,
  }));

  // Save entries
  const allVocab = getAllVocabulary();
  // Avoid duplicates by word (case-insensitive) per user batches
  const existingWords = new Set(
    getUserVocabulary(userId).map(v => v.word.toLowerCase())
  );
  const newEntries = timestampedEntries.filter(
    e => !existingWords.has(e.word.toLowerCase())
  );
  const updatedVocab = [...allVocab, ...newEntries];
  localStorage.setItem(VOCABULARY_KEY, JSON.stringify(updatedVocab));

  // Save batch record
  const batch: VocabularyBatch = {
    id: batchId,
    userId,
    addedAt: Date.now(),
    label,
    words: newEntries.map(e => e.word),
  };
  const allBatches = getAllVocabBatches();
  localStorage.setItem(VOCAB_BATCHES_KEY, JSON.stringify([batch, ...allBatches]));

  return { entries: newEntries, batch };
};

export const deleteVocabularyWord = (userId: string, word: string): VocabularyEntry[] => {
  const allVocab = getAllVocabulary();
  const userBatches = getUserVocabBatches(userId);
  const userBatchIds = new Set(userBatches.map(b => b.id));
  
  const updated = allVocab.filter(
    v => !(userBatchIds.has(v.batchId) && v.word.toLowerCase() === word.toLowerCase())
  );
  localStorage.setItem(VOCABULARY_KEY, JSON.stringify(updated));
  return getUserVocabulary(userId);
};

export const clearUserVocabulary = (userId: string): void => {
  const userBatches = getUserVocabBatches(userId);
  const userBatchIds = new Set(userBatches.map(b => b.id));
  
  // Remove user's vocab entries
  const allVocab = getAllVocabulary();
  const keptVocab = allVocab.filter(v => !userBatchIds.has(v.batchId));
  localStorage.setItem(VOCABULARY_KEY, JSON.stringify(keptVocab));
  
  // Remove user's batches
  const allBatches = getAllVocabBatches();
  const keptBatches = allBatches.filter(b => b.userId !== userId);
  localStorage.setItem(VOCAB_BATCHES_KEY, JSON.stringify(keptBatches));
};