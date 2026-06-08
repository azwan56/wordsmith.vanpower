/**
 * Quiz Service
 * 
 * Generates quiz questions from vocabulary entries for review mode.
 * All generation is client-side — no API calls needed.
 * Supports 4 quiz types: synonym match, antonym match, definition match, fill-in-the-blank.
 */

import { VocabularyEntry, QuizQuestion, QuizType } from '../types';

// --- Helpers ---

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Pick N random items from an array, excluding items in the exclude set.
 */
const pickRandom = <T,>(arr: T[], n: number, exclude: Set<string> = new Set(), keyFn: (item: T) => string = String): T[] => {
  const filtered = arr.filter(item => !exclude.has(keyFn(item)));
  return shuffle(filtered).slice(0, n);
};

// --- Quiz Question Generators ---

const generateSynonymQuestion = (entry: VocabularyEntry, allEntries: VocabularyEntry[]): QuizQuestion | null => {
  if (!entry.synonyms || entry.synonyms.length === 0) return null;
  
  const correctAnswer = entry.synonyms[Math.floor(Math.random() * entry.synonyms.length)];
  
  // Get distractor words from other entries' synonyms or the words themselves
  const distractorPool: string[] = [];
  for (const other of allEntries) {
    if (other.word.toLowerCase() === entry.word.toLowerCase()) continue;
    distractorPool.push(other.word);
    if (other.synonyms) distractorPool.push(...other.synonyms);
  }
  
  const distractors = pickRandom(
    [...new Set(distractorPool)].filter(d => 
      d.toLowerCase() !== correctAnswer.toLowerCase() && 
      !entry.synonyms.map(s => s.toLowerCase()).includes(d.toLowerCase())
    ),
    3
  );
  
  if (distractors.length < 3) return null; // not enough distractors
  
  const options = shuffle([correctAnswer, ...distractors]);
  
  return {
    type: 'synonym',
    word: entry.word,
    prompt: `Which word means the same as "${entry.word}"?`,
    options,
    correctAnswer,
    explanation: `"${entry.word}" means: ${entry.definition}. Synonyms include: ${entry.synonyms.join(', ')}.`,
  };
};

const generateAntonymQuestion = (entry: VocabularyEntry, allEntries: VocabularyEntry[]): QuizQuestion | null => {
  if (!entry.antonyms || entry.antonyms.length === 0) return null;
  
  const correctAnswer = entry.antonyms[Math.floor(Math.random() * entry.antonyms.length)];
  
  // Use synonyms and other words as distractors (they're NOT antonyms)
  const distractorPool: string[] = [];
  if (entry.synonyms) distractorPool.push(...entry.synonyms);
  for (const other of allEntries) {
    if (other.word.toLowerCase() === entry.word.toLowerCase()) continue;
    distractorPool.push(other.word);
  }
  
  const distractors = pickRandom(
    [...new Set(distractorPool)].filter(d => 
      d.toLowerCase() !== correctAnswer.toLowerCase() &&
      !entry.antonyms!.map(a => a.toLowerCase()).includes(d.toLowerCase())
    ),
    3
  );
  
  if (distractors.length < 3) return null;
  
  const options = shuffle([correctAnswer, ...distractors]);
  
  return {
    type: 'antonym',
    word: entry.word,
    prompt: `Which word means the OPPOSITE of "${entry.word}"?`,
    options,
    correctAnswer,
    explanation: `"${entry.word}" means: ${entry.definition}. Its antonyms include: ${entry.antonyms.join(', ')}.`,
  };
};

const generateDefinitionQuestion = (entry: VocabularyEntry, allEntries: VocabularyEntry[]): QuizQuestion | null => {
  // Get 3 other entries with different definitions as distractors
  const others = pickRandom(
    allEntries.filter(e => e.word.toLowerCase() !== entry.word.toLowerCase()),
    3,
    new Set(),
    e => e.word.toLowerCase()
  );
  
  if (others.length < 3) return null;
  
  const options = shuffle([entry.word, ...others.map(o => o.word)]);
  
  return {
    type: 'definition',
    word: entry.word,
    prompt: `Which word means: "${entry.definition}"?`,
    options,
    correctAnswer: entry.word,
    explanation: `"${entry.word}" (${entry.partOfSpeech}) — ${entry.definition}`,
  };
};

const generateFillBlankQuestion = (entry: VocabularyEntry): QuizQuestion | null => {
  if (!entry.example) return null;
  
  // Replace the word in the example sentence with a blank
  const wordRegex = new RegExp(`\\b${entry.word}\\b`, 'gi');
  if (!wordRegex.test(entry.example)) {
    // Word not found literally in example, create a generic prompt
    return {
      type: 'fill-blank',
      word: entry.word,
      prompt: `Fill in the blank: "${entry.definition}" — The word is a ${entry.partOfSpeech}.`,
      correctAnswer: entry.word.toLowerCase(),
      explanation: `The answer is "${entry.word}". Example: "${entry.example}"`,
    };
  }
  
  const blankedSentence = entry.example.replace(wordRegex, '______');
  
  return {
    type: 'fill-blank',
    word: entry.word,
    prompt: `Fill in the blank:\n"${blankedSentence}"`,
    correctAnswer: entry.word.toLowerCase(),
    explanation: `The complete sentence: "${entry.example}"`,
  };
};

// --- Main Quiz Generation ---

/**
 * Generate a set of quiz questions from vocabulary entries.
 * Returns a shuffled mix of all 4 quiz types.
 * 
 * @param entries - Vocabulary entries to generate questions from (question focus)
 * @param count - Number of questions to generate (default 10)
 * @param allEntries - Full vocabulary pool used for generating distractors. Defaults to `entries`.
 * @returns Array of QuizQuestion
 */
export const generateQuizQuestions = (
  entries: VocabularyEntry[],
  count: number = 10,
  allEntries?: VocabularyEntry[]
): QuizQuestion[] => {
  const pool = allEntries && allEntries.length >= entries.length ? allEntries : entries;
  if (pool.length < 4) return []; // Need at least 4 entries for multiple choice
  
  const questions: QuizQuestion[] = [];
  const usedWords = new Set<string>(); // Track which words have been used per type
  const shuffledEntries = shuffle(entries);
  
  // Determine available quiz types based on data
  const quizTypes: QuizType[] = ['synonym', 'definition']; // Always available
  
  // Check if any entries have antonyms
  if (entries.some(e => e.antonyms && e.antonyms.length > 0)) {
    quizTypes.push('antonym');
  }
  // Check if any entries have examples
  if (entries.some(e => e.example)) {
    quizTypes.push('fill-blank');
  }
  
  // Generate questions, cycling through types
  let typeIndex = 0;
  let attempts = 0;
  const maxAttempts = entries.length * quizTypes.length * 2;
  
  while (questions.length < count && attempts < maxAttempts) {
    attempts++;
    const currentType = quizTypes[typeIndex % quizTypes.length];
    typeIndex++;
    
    // Find an entry that hasn't been used for this question type yet
    const entry = shuffledEntries.find(e => {
      const key = `${currentType}-${e.word.toLowerCase()}`;
      return !usedWords.has(key);
    });
    
    if (!entry) continue;
    
    let question: QuizQuestion | null = null;
    
    switch (currentType) {
      case 'synonym':
        question = generateSynonymQuestion(entry, pool);
        break;
      case 'antonym':
        question = generateAntonymQuestion(entry, pool);
        break;
      case 'definition':
        question = generateDefinitionQuestion(entry, pool);
        break;
      case 'fill-blank':
        question = generateFillBlankQuestion(entry);
        break;
    }
    
    if (question) {
      questions.push(question);
      usedWords.add(`${currentType}-${entry.word.toLowerCase()}`);
    }
  }
  
  return shuffle(questions).slice(0, count);
};

/**
 * Evaluate a user's answer to a quiz question.
 * For multiple choice, checks exact match.
 * For fill-in-the-blank, does case-insensitive comparison with some flexibility.
 */
export const evaluateQuizAnswer = (
  question: QuizQuestion,
  userAnswer: string
): boolean => {
  const normalizedAnswer = userAnswer.trim().toLowerCase();
  const normalizedCorrect = question.correctAnswer.trim().toLowerCase();
  
  if (question.type === 'fill-blank') {
    // Allow slight flexibility: exact match or contained match
    return normalizedAnswer === normalizedCorrect || 
           normalizedCorrect.includes(normalizedAnswer) && normalizedAnswer.length >= normalizedCorrect.length - 2;
  }
  
  // For multiple choice, exact match
  return normalizedAnswer === normalizedCorrect;
};
