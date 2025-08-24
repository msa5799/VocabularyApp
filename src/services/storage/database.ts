import * as SQLite from 'expo-sqlite';
import { User, Word, Test, UserProgress, UserAnswer, DailyWord } from '../../types/database';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initializeDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('vocabulary_app.db');
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const queries = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        current_level TEXT DEFAULT 'A1',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Words table
      `CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT UNIQUE NOT NULL,
        definition_en TEXT NOT NULL,
        definition_tr TEXT NOT NULL,
        example_en TEXT,
        example_tr TEXT,
        pronunciation TEXT,
        cefr_level TEXT NOT NULL,
        part_of_speech TEXT,
        frequency_rank INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tests table
      `CREATE TABLE IF NOT EXISTS tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        test_type TEXT NOT NULL,
        cefr_level TEXT NOT NULL,
        total_questions INTEGER NOT NULL,
        correct_answers INTEGER NOT NULL,
        score_percentage REAL NOT NULL,
        duration_seconds INTEGER NOT NULL,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // User Progress table
      `CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        word_id INTEGER NOT NULL,
        status TEXT DEFAULT 'learning',
        correct_count INTEGER DEFAULT 0,
        incorrect_count INTEGER DEFAULT 0,
        last_reviewed DATETIME,
        next_review DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (word_id) REFERENCES words (id),
        UNIQUE(user_id, word_id)
      )`,

      // User Answers table
      `CREATE TABLE IF NOT EXISTS user_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id INTEGER NOT NULL,
        word_id INTEGER NOT NULL,
        user_answer TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        is_correct BOOLEAN NOT NULL,
        response_time_ms INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (test_id) REFERENCES tests (id),
        FOREIGN KEY (word_id) REFERENCES words (id)
      )`,

      // Daily Words table
      `CREATE TABLE IF NOT EXISTS daily_words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        word_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (word_id) REFERENCES words (id),
        UNIQUE(user_id, word_id, date)
      )`,

      // Create indexes for better performance
      `CREATE INDEX IF NOT EXISTS idx_words_cefr_level ON words(cefr_level)`,
      `CREATE INDEX IF NOT EXISTS idx_words_frequency ON words(frequency_rank)`,
      `CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_tests_user_id ON tests(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_daily_words_user_date ON daily_words(user_id, date)`
    ];

    for (const query of queries) {
      await this.db.execAsync(query);
    }
  }

  // User operations
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    if (!this.db) throw new Error('Database not initialized');
    
    const now = new Date().toISOString();
    const result = await this.db.runAsync(
      'INSERT INTO users (email, username, password_hash, current_level, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userData.email, userData.username, userData.password_hash, userData.current_level, now, now]
    );
    
    const newUser: User = {
      ...userData,
      id: result.lastInsertRowId.toString(),
      created_at: now,
      updated_at: now
    };
    
    return newUser;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getFirstAsync<User>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    return result || null;
  }

  async getUserById(id: number): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getFirstAsync<User>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    return result || null;
  }

  async updateUserLevel(userId: number, level: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      'UPDATE users SET current_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [level, userId]
    );
  }

  // Word operations
  async insertWords(words: Omit<Word, 'id' | 'created_at'>[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const statement = await this.db.prepareAsync(
      'INSERT OR REPLACE INTO words (word, definition_en, definition_tr, example_en, example_tr, pronunciation, cefr_level, part_of_speech, frequency_rank) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    
    try {
      for (const word of words) {
        await statement.executeAsync([
          word.word,
          word.definition_en,
          word.definition_tr,
          word.example_en || null,
          word.example_tr || null,
          word.pronunciation || null,
          word.cefr_level,
          word.part_of_speech || null,
          word.frequency_rank || null
        ]);
      }
    } finally {
      await statement.finalizeAsync();
    }
  }

  async getWordsByLevel(level: string, limit: number = 50): Promise<Word[]> {
    // API kullanıldığı için boş array döndür
    return [];
  }

  async getRandomWordsByLevel(level: string, count: number = 10): Promise<Word[]> {
    // API kullanıldığı için boş array döndür
    return [];
  }

  // Yeni: Arama operasyonu
  async getWordsByQuery(query: string, limit: number = 50): Promise<Word[]> {
    if (!this.db) throw new Error('Database not initialized');

    const like = `%${query}%`;
    const result = await this.db.getAllAsync<Word>(
      `SELECT * FROM words 
       WHERE (word LIKE ? COLLATE NOCASE) 
          OR (definition_en LIKE ? COLLATE NOCASE) 
          OR (definition_tr LIKE ? COLLATE NOCASE)
       ORDER BY frequency_rank ASC
       LIMIT ?`,
      [like, like, like, limit]
    );

    return result;
  }

  // Test operations
  async createTest(testData: Omit<Test, 'id' | 'created_at' | 'completed_at'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.runAsync(
      'INSERT INTO tests (user_id, test_type, cefr_level, total_questions, correct_answers, score_percentage, duration_seconds) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [testData.user_id, testData.test_type, testData.cefr_level, testData.total_questions, testData.correct_answers, testData.score_percentage, testData.duration_seconds]
    );
    
    return result.lastInsertRowId;
  }

  async getUserTests(userId: number, limit: number = 10): Promise<Test[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync<Test>(
      'SELECT * FROM tests WHERE user_id = ? ORDER BY completed_at DESC LIMIT ?',
      [userId, limit]
    );
    
    return result;
  }

  // Progress operations
  async updateWordProgress(userId: number, wordId: number, isCorrect: boolean): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      `INSERT OR REPLACE INTO user_progress 
       (user_id, word_id, status, correct_count, incorrect_count, last_reviewed, next_review, created_at, updated_at)
       VALUES (
         ?, ?, 
         CASE 
           WHEN ? THEN 
             CASE 
               WHEN (SELECT correct_count FROM user_progress WHERE user_id = ? AND word_id = ?) >= 3 THEN 'mastered'
               WHEN (SELECT correct_count FROM user_progress WHERE user_id = ? AND word_id = ?) >= 1 THEN 'known'
               ELSE 'learning'
             END
           ELSE 'learning'
         END,
         COALESCE((SELECT correct_count FROM user_progress WHERE user_id = ? AND word_id = ?), 0) + CASE WHEN ? THEN 1 ELSE 0 END,
         COALESCE((SELECT incorrect_count FROM user_progress WHERE user_id = ? AND word_id = ?), 0) + CASE WHEN ? THEN 0 ELSE 1 END,
         CURRENT_TIMESTAMP,
         datetime('now', '+1 day'),
         COALESCE((SELECT created_at FROM user_progress WHERE user_id = ? AND word_id = ?), CURRENT_TIMESTAMP),
         CURRENT_TIMESTAMP
       )`,
      [userId, wordId, isCorrect, userId, wordId, userId, wordId, userId, wordId, isCorrect, userId, wordId, !isCorrect, userId, wordId]
    );
  }

  async getUserProgress(userId: number): Promise<UserProgress[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync<UserProgress>(
      'SELECT * FROM user_progress WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );
    
    return result;
  }

  // Daily words operations
  async setDailyWords(userId: number, wordIds: number[], date: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const statement = await this.db.prepareAsync(
      'INSERT OR REPLACE INTO daily_words (user_id, word_id, date, is_completed) VALUES (?, ?, ?, FALSE)'
    );
    
    try {
      for (const wordId of wordIds) {
        await statement.executeAsync([userId, wordId, date]);
      }
    } finally {
      await statement.finalizeAsync();
    }
  }

  async getDailyWords(userId: number, date: string): Promise<(DailyWord & Word)[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync<DailyWord & Word>(
      `SELECT dw.*, w.word, w.definition_en, w.definition_tr, w.example_en, w.example_tr, w.pronunciation, w.cefr_level, w.part_of_speech
       FROM daily_words dw
       JOIN words w ON dw.word_id = w.id
       WHERE dw.user_id = ? AND dw.date = ?
       ORDER BY dw.created_at`,
      [userId, date]
    );
    
    return result;
  }

  async markDailyWordCompleted(userId: number, wordId: number, date: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      'UPDATE daily_words SET is_completed = TRUE WHERE user_id = ? AND word_id = ? AND date = ?',
      [userId, wordId, date]
    );
  }

  // Seed operations
  async getWordCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM words'
    );
    
    return result?.count || 0;
  }

  async seedDatabase(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      // Check if database already has words
      const wordCount = await this.getWordCount();
      if (wordCount > 0) {
        console.log(`Database already has ${wordCount} words, skipping seed`);
        return;
      }

      console.log('Starting database seed...');
      
      // Import vocabularyAPI here to avoid circular dependency
      const { vocabularyAPI } = await import('../api/vocabularyAPI');
      
      // Generate words for all levels
      const allWords = await vocabularyAPI.generateAllLevelsWords();
      
      if (allWords.length > 0) {
        await this.insertWords(allWords);
        console.log(`Successfully seeded database with ${allWords.length} words`);
      } else {
        console.warn('No words generated for seeding');
      }
      
    } catch (error) {
      console.error('Error seeding database:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

export const databaseService = new DatabaseService();