export interface WordChallenge {
  word: string;
  partOfSpeech: string;
  definition: string;
  synonyms: string[];
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
  mode: 'random' | 'custom';
  results: BatchResult[];
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  word: string;
  userSentence: string;
  score: number;
}

export interface UserProfile {
  id: string;
  name: string;
  pin: string; // 4 digits
  color: string; // TailWind color name e.g. 'blue', 'green', 'purple'
  createdAt: number;
  discordWebhookUrl?: string;
}