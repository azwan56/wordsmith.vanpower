export interface WordChallenge {
  word: string;
  partOfSpeech: string;
  definition: string;
  synonyms: string[];
  antonyms?: string[]; // newly added for explanation mode
  example?: string;    // newly added for explanation mode
}

export interface EvaluationResult {
  score: number; // 1 to 5
  feedback: string;
  correction?: string; // Optional corrected sentence if grammar was wrong
  betterExamples: string[]; // 2 examples
}

export interface BatchResult {
  wordChallenge: WordChallenge;
  userSentence: string;
  evaluation: EvaluationResult;
}

export interface SessionRecord {
  id: string;
  userId: string; // Linked to UserProfile.id
  timestamp: number;
  mode: 'random' | 'custom' | 'vocabulary';
  results: BatchResult[];
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  word: string;
  userSentence: string;
  score: number;
}

export interface VocabularyEntry {
  word: string;
  partOfSpeech: string;
  definition: string;
  synonyms: string[];
  antonyms?: string[];
  example?: string;
  addedAt: number; // timestamp when added
  batchId: string; // which batch this word was added in
  docId?: string; // Firestore document ID
  addedBy?: string; // uid of user who added it
  addedByName?: string; // display name of who added
}

export interface PracticeRecord {
  word: string; // lowercase key
  bestScore: number; // highest score achieved (1-5)
  lastPracticedAt: number;
  attempts: number; // total number of times practiced
  // SRS (Spaced Repetition) fields
  reviewInterval: number;   // days until next review (default 1)
  easeFactor: number;        // SM-2 ease factor (default 2.5)
  nextReviewDate: number;    // timestamp of next scheduled review
}

export interface VocabularyBatch {
  id: string;
  userId: string;
  addedAt: number;
  label?: string; // optional label like "Spelling Bee Week 5"
  words: string[]; // word strings belonging to this batch
}

export interface UserProfile {
  id: string;
  name: string;
  pin: string; // 4 digits
  color: string; // TailWind color name e.g. 'blue', 'green', 'purple'
  createdAt: number;
  discordWebhookUrl?: string;
}

export interface SmartWordSelection {
  unpracticed: VocabularyEntry[]; // words user hasn't tried
  needsWork: VocabularyEntry[];   // words scored < 4
  mastered: VocabularyEntry[];    // words scored >= 4
}

// --- Quiz Types ---

export type QuizType = 'synonym' | 'antonym' | 'definition' | 'fill-blank';

export interface QuizQuestion {
  type: QuizType;
  word: string;
  prompt: string;
  options?: string[];        // for multiple choice
  correctAnswer: string;
  explanation: string;
}

export interface QuizResult {
  question: QuizQuestion;
  userAnswer: string;
  isCorrect: boolean;
  timeTaken: number;         // milliseconds
}

// --- Streak & Achievements ---

export interface StreakData {
  current: number;
  longest: number;
  lastPracticeDate: string;  // YYYY-MM-DD format
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;              // emoji
  unlockedAt?: number;       // timestamp, undefined = locked
}

export const ALL_ACHIEVEMENTS: Omit<Achievement, 'unlockedAt'>[] = [
  { id: 'first_words', name: 'First Words', description: 'Complete your first practice session', icon: '🌱' },
  { id: 'star_collector', name: 'Star Collector', description: 'Earn 50 total stars', icon: '⭐' },
  { id: 'on_fire', name: 'On Fire', description: 'Practice for 3 days in a row', icon: '🔥' },
  { id: 'vocab_master', name: 'Vocabulary Master', description: 'Master 25 words (score ≥ 4)', icon: '🏆' },
  { id: 'word_wizard', name: 'Word Wizard', description: 'Practice 100 total words', icon: '📚' },
  { id: 'perfect_session', name: 'Perfect Session', description: 'Get 5/5 on every word in a batch', icon: '💯' },
];