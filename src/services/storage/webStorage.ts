import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Word, Test, UserProgress, UserAnswer, DailyWord } from '../../types/database';


class WebStorageService {
  private storageKeys = {
    users: 'vocabulary_app_users',
    words: 'vocabulary_app_words',
    tests: 'vocabulary_app_tests',
    progress: 'vocabulary_app_progress',
    dailyWords: 'vocabulary_app_daily_words',
    currentUser: 'vocabulary_app_current_user'
  };

  async initializeDatabase(): Promise<void> {
    try {
      // Initialize with some default data if needed
      const existingUsers = await this.getStorageData(this.storageKeys.users);
      if (!existingUsers) {
        await AsyncStorage.setItem(this.storageKeys.users, JSON.stringify([]));
      }
      
      const existingWords = await this.getStorageData(this.storageKeys.words);
      if (!existingWords) {
        await AsyncStorage.setItem(this.storageKeys.words, JSON.stringify([]));
      }
      
      console.log('Web storage initialized successfully');
    } catch (error) {
      console.error('Web storage initialization failed:', error);
      throw error;
    }
  }

  private async getStorageData(key: string): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting storage data for key ${key}:`, error);
      return null;
    }
  }

  private async setStorageData(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error setting storage data for key ${key}:`, error);
      throw error;
    }
  }

  // User methods
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    console.log('webStorage createUser called with:', userData);
    const users: User[] = await this.getStorageData(this.storageKeys.users) || [];
    console.log('Current users:', users.length);
    const newId = Math.max(0, ...users.map(u => u.id)) + 1;
    console.log('New ID will be:', newId);
    const now = new Date().toISOString();
    
    const newUser: User = {
      ...userData,
      id: newId,
      created_at: now,
      updated_at: now
    };
    console.log('New user object:', newUser);
    
    users.push(newUser);
    console.log('User added to array, total users:', users.length);
    await this.setStorageData(this.storageKeys.users, users);
    console.log('Users saved to storage');
    
    return newId;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users: User[] = await this.getStorageData(this.storageKeys.users) || [];
    return users.find(user => user.email === email) || null;
  }

  async getUserById(id: number): Promise<User | null> {
    const users: User[] = await this.getStorageData(this.storageKeys.users) || [];
    return users.find(user => user.id === id) || null;
  }

  async updateUserLevel(userId: number, level: string): Promise<void> {
    const users: User[] = await this.getStorageData(this.storageKeys.users) || [];
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex].current_level = level;
      users[userIndex].updated_at = new Date().toISOString();
      await this.setStorageData(this.storageKeys.users, users);
    }
  }

  // Word methods
  async insertWords(words: Omit<Word, 'id' | 'created_at'>[]): Promise<void> {
    const existingWords: Word[] = await this.getStorageData(this.storageKeys.words) || [];
    const maxId = Math.max(0, ...existingWords.map(w => w.id));
    
    const newWords = words.map((word, index) => ({
      ...word,
      id: maxId + index + 1,
      created_at: new Date().toISOString()
    }));
    
    const allWords = [...existingWords, ...newWords];
    await this.setStorageData(this.storageKeys.words, allWords);
  }

  async getWordsByLevel(level: string, limit: number = 50): Promise<Word[]> {
    // API kullanıldığı için boş array döndür
    return [];
  }

  async getRandomWordsByLevel(level: string, count: number = 10): Promise<Word[]> {
    // API kullanıldığı için boş array döndür
    return [];
  }

  // API kullanıldığı için arama metodu
  async getWordsByQuery(query: string, limit: number = 50): Promise<Word[]> {
    // API kullanıldığı için boş array döndür
    return [];
  }

  // Test methods
  async createTest(testData: Omit<Test, 'id' | 'created_at'>): Promise<number> {
    const tests: Test[] = await this.getStorageData(this.storageKeys.tests) || [];
    const newId = Math.max(0, ...tests.map(t => t.id)) + 1;
    
    const newTest: Test = {
      ...testData,
      id: newId,
      created_at: new Date().toISOString()
    };
    
    tests.push(newTest);
    await this.setStorageData(this.storageKeys.tests, tests);
    return newId;
  }

  async getUserTests(userId: number, limit: number = 10): Promise<Test[]> {
    const tests: Test[] = await this.getStorageData(this.storageKeys.tests) || [];
    return tests
      .filter(test => test.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  // Progress methods
  async updateWordProgress(userId: number, wordId: number, isCorrect: boolean): Promise<void> {
    const progressList: UserProgress[] = await this.getStorageData(this.storageKeys.progress) || [];
    const existingIndex = progressList.findIndex(p => p.user_id === userId && p.word_id === wordId);
    
    if (existingIndex !== -1) {
      const existing = progressList[existingIndex];
      progressList[existingIndex] = {
        ...existing,
        correct_count: existing.correct_count + (isCorrect ? 1 : 0),
        incorrect_count: existing.incorrect_count + (isCorrect ? 0 : 1),
        last_reviewed: new Date().toISOString(),
        next_review: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Next day
        updated_at: new Date().toISOString()
      };
    } else {
      const newProgress: UserProgress = {
        id: Math.max(0, ...progressList.map(p => p.id)) + 1,
        user_id: userId,
        word_id: wordId,
        status: 'learning',
        correct_count: isCorrect ? 1 : 0,
        incorrect_count: isCorrect ? 0 : 1,
        last_reviewed: new Date().toISOString(),
        next_review: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      progressList.push(newProgress);
    }
    
    await this.setStorageData(this.storageKeys.progress, progressList);
  }

  async getUserProgress(userId: number): Promise<UserProgress[]> {
    const progressList: UserProgress[] = await this.getStorageData(this.storageKeys.progress) || [];
    return progressList.filter(progress => progress.user_id === userId);
  }

  // Daily words methods
  async setDailyWords(userId: number, wordIds: number[], date: string): Promise<void> {
    const dailyWords: DailyWord[] = await this.getStorageData(this.storageKeys.dailyWords) || [];
    const maxId = Math.max(0, ...dailyWords.map(d => d.id));
    
    const newDailyWords = wordIds.map((wordId, index) => ({
      id: maxId + index + 1,
      user_id: userId,
      word_id: wordId,
      date,
      is_completed: false,
      created_at: new Date().toISOString()
    }));
    
    // Remove existing daily words for this user and date
    const filtered = dailyWords.filter(d => !(d.user_id === userId && d.date === date));
    const updated = [...filtered, ...newDailyWords];
    
    await this.setStorageData(this.storageKeys.dailyWords, updated);
  }

  async getDailyWords(userId: number, date: string): Promise<(DailyWord & Word)[]> {
    try {
      const dailyWords: DailyWord[] = await this.getStorageData(this.storageKeys.dailyWords) || [];
      
      const userDailyWords = dailyWords.filter(d => d.user_id === userId && d.date === date);
      
      // API kullanıldığı için boş array döndür
      return [];
    } catch (error) {
      console.error('Error getting daily words:', error);
      return [];
    }
  }

  async markDailyWordCompleted(userId: number, wordId: number, date: string): Promise<void> {
    const dailyWords: DailyWord[] = await this.getStorageData(this.storageKeys.dailyWords) || [];
    const index = dailyWords.findIndex(d => 
      d.user_id === userId && d.word_id === wordId && d.date === date
    );
    
    if (index !== -1) {
      dailyWords[index].is_completed = true;
      await this.setStorageData(this.storageKeys.dailyWords, dailyWords);
    }
  }

  // Seed operations
  async getWordCount(): Promise<number> {
    const words: Word[] = await this.getStorageData(this.storageKeys.words) || [];
    return words.length;
  }

  async seedDatabase(): Promise<void> {
    try {
      console.log('Seeding not needed - using API data directly');
    } catch (error) {
      console.error('Error in seedDatabase:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    // No cleanup needed for AsyncStorage
    console.log('Web storage service closed');
  }
}

export const webStorageService = new WebStorageService();