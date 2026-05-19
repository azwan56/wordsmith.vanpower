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