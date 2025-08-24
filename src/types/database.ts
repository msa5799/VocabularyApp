export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  current_level: string; // A1, A2, B1, B2, C1, C2
  google_id?: string;
  firebase_uid?: string;
  profile_picture?: string;
  created_at: string;
  updated_at: string;
}

export interface Word {
  id: number;
  word: string;
  definition_en: string;
  definition_tr: string;
  example_en?: string;
  example_tr?: string;
  pronunciation?: string;
  cefr_level: string; // A1, A2, B1, B2, C1, C2
  part_of_speech?: string;
  frequency_rank?: number;
  created_at: string;
}

export interface Test {
  id: number;
  user_id: number;
  test_type: 'level_assessment' | 'daily_practice' | 'vocabulary_quiz';
  cefr_level: string;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  duration_seconds: number;
  completed_at: string;
  created_at: string;
}

export interface UserProgress {
  id: number;
  user_id: number;
  word_id: number;
  status: 'learning' | 'known' | 'mastered' | 'difficult';
  correct_count: number;
  incorrect_count: number;
  last_reviewed: string;
  next_review: string;
  created_at: string;
  updated_at: string;
}

export interface UserAnswer {
  id: number;
  test_id: number;
  word_id: number;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  response_time_ms: number;
  created_at: string;
}

export interface DailyWord {
  id: number;
  user_id: number;
  word_id: number;
  date: string;
  is_completed: boolean;
  created_at: string;
}

// Database initialization types
export interface DatabaseSchema {
  users: User;
  words: Word;
  tests: Test;
  user_progress: UserProgress;
  user_answers: UserAnswer;
  daily_words: DailyWord;
}

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type TestType = 'level_assessment' | 'daily_practice' | 'vocabulary_quiz';
export type WordStatus = 'learning' | 'known' | 'mastered' | 'difficult';