import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, Word, Test, UserProgress, UserAnswer, DailyWord } from '../../types/database';

class FirestoreService {
  // Users Collection
  async createUser(user: Omit<User, 'id'>): Promise<User> {
    try {
      const userRef = await addDoc(collection(db, 'users'), {
        ...user,
        created_at: Timestamp.now().toDate().toISOString(),
        updated_at: Timestamp.now().toDate().toISOString()
      });
      
      const createdUser: User = {
        ...user,
        id: parseInt(userRef.id, 36), // Convert Firestore ID to number
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return createdUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      return {
        id: parseInt(userDoc.id, 36),
        ...userData
      } as User;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
    try {
      const q = query(collection(db, 'users'), where('firebase_uid', '==', firebaseUid));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      return {
        id: parseInt(userDoc.id, 36),
        ...userData
      } as User;
    } catch (error) {
      console.error('Error getting user by Firebase UID:', error);
      throw error;
    }
  }

  async updateUser(userId: number, updates: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId.toString(36));
      await updateDoc(userRef, {
        ...updates,
        updated_at: Timestamp.now().toDate().toISOString()
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async updateUserLevel(userId: number, level: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId.toString(36));
      await updateDoc(userRef, {
        current_level: level,
        updated_at: Timestamp.now().toDate().toISOString()
      });
    } catch (error) {
      console.error('Error updating user level:', error);
      throw error;
    }
  }

  // Words Collection
  async getWordsByLevel(level: string, limitCount: number = 50): Promise<Word[]> {
    try {
      const q = query(
        collection(db, 'words'),
        where('cefr_level', '==', level),
        orderBy('frequency_rank', 'asc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const words: Word[] = [];
      
      querySnapshot.forEach((doc) => {
        words.push({
          id: parseInt(doc.id, 36),
          ...doc.data()
        } as Word);
      });
      
      return words;
    } catch (error) {
      console.error('Error getting words by level:', error);
      throw error;
    }
  }

  async getRandomWords(level: string, count: number): Promise<Word[]> {
    try {
      // Firestore doesn't have a native random function, so we'll get more words and shuffle
      const words = await this.getWordsByLevel(level, count * 3);
      
      // Shuffle array and return requested count
      const shuffled = words.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    } catch (error) {
      console.error('Error getting random words:', error);
      throw error;
    }
  }

  // Tests Collection
  async createTest(test: Omit<Test, 'id'>): Promise<Test> {
    try {
      const testRef = await addDoc(collection(db, 'tests'), {
        ...test,
        created_at: Timestamp.now().toDate().toISOString()
      });
      
      return {
        ...test,
        id: parseInt(testRef.id, 36),
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating test:', error);
      throw error;
    }
  }

  async getUserTests(userId: number): Promise<Test[]> {
    try {
      const q = query(
        collection(db, 'tests'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const tests: Test[] = [];
      
      querySnapshot.forEach((doc) => {
        tests.push({
          id: parseInt(doc.id, 36),
          ...doc.data()
        } as Test);
      });
      
      return tests;
    } catch (error) {
      console.error('Error getting user tests:', error);
      throw error;
    }
  }

  // User Progress Collection
  async getUserProgress(userId: number): Promise<UserProgress[]> {
    try {
      const q = query(
        collection(db, 'user_progress'),
        where('user_id', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const progress: UserProgress[] = [];
      
      querySnapshot.forEach((doc) => {
        progress.push({
          id: parseInt(doc.id, 36),
          ...doc.data()
        } as UserProgress);
      });
      
      return progress;
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  }

  async updateUserProgress(userId: number, wordId: number, progress: Partial<UserProgress>): Promise<void> {
    try {
      // Check if progress exists
      const q = query(
        collection(db, 'user_progress'),
        where('user_id', '==', userId),
        where('word_id', '==', wordId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create new progress
        await addDoc(collection(db, 'user_progress'), {
          user_id: userId,
          word_id: wordId,
          ...progress,
          created_at: Timestamp.now().toDate().toISOString(),
          updated_at: Timestamp.now().toDate().toISOString()
        });
      } else {
        // Update existing progress
        const progressDoc = querySnapshot.docs[0];
        await updateDoc(progressDoc.ref, {
          ...progress,
          updated_at: Timestamp.now().toDate().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating user progress:', error);
      throw error;
    }
  }

  // Daily Words Collection
  async getDailyWords(userId: number, date: string): Promise<DailyWord[]> {
    try {
      const q = query(
        collection(db, 'daily_words'),
        where('user_id', '==', userId),
        where('date', '==', date)
      );
      
      const querySnapshot = await getDocs(q);
      const dailyWords: DailyWord[] = [];
      
      querySnapshot.forEach((doc) => {
        dailyWords.push({
          id: parseInt(doc.id, 36),
          ...doc.data()
        } as DailyWord);
      });
      
      return dailyWords;
    } catch (error) {
      console.error('Error getting daily words:', error);
      throw error;
    }
  }

  async createDailyWord(dailyWord: Omit<DailyWord, 'id'>): Promise<DailyWord> {
    try {
      const dailyWordRef = await addDoc(collection(db, 'daily_words'), {
        ...dailyWord,
        created_at: Timestamp.now().toDate().toISOString()
      });
      
      return {
        ...dailyWord,
        id: parseInt(dailyWordRef.id, 36),
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating daily word:', error);
      throw error;
    }
  }

  // Utility method to initialize Firestore with sample data
  async initializeSampleData(): Promise<void> {
    try {
      // Check if words collection is empty
      const wordsQuery = query(collection(db, 'words'), limit(1));
      const wordsSnapshot = await getDocs(wordsQuery);
      
      if (wordsSnapshot.empty) {
        console.log('Initializing Firestore with sample words...');
        
        // Sample words for different levels
        const sampleWords = [
          {
            word: 'hello',
            definition_en: 'A greeting',
            definition_tr: 'Merhaba, selam',
            example_en: 'Hello, how are you?',
            example_tr: 'Merhaba, nasılsın?',
            cefr_level: 'A1',
            part_of_speech: 'interjection',
            frequency_rank: 1
          },
          {
            word: 'goodbye',
            definition_en: 'A farewell',
            definition_tr: 'Hoşçakal, güle güle',
            example_en: 'Goodbye, see you tomorrow!',
            example_tr: 'Hoşçakal, yarın görüşürüz!',
            cefr_level: 'A1',
            part_of_speech: 'interjection',
            frequency_rank: 2
          },
          {
            word: 'beautiful',
            definition_en: 'Pleasing to look at',
            definition_tr: 'Güzel, hoş',
            example_en: 'She has a beautiful smile.',
            example_tr: 'Onun güzel bir gülümsemesi var.',
            cefr_level: 'A2',
            part_of_speech: 'adjective',
            frequency_rank: 3
          }
        ];
        
        for (const word of sampleWords) {
          await addDoc(collection(db, 'words'), {
            ...word,
            created_at: Timestamp.now().toDate().toISOString()
          });
        }
        
        console.log('Sample words added to Firestore');
      }
    } catch (error) {
      console.error('Error initializing sample data:', error);
      throw error;
    }
  }
}

export const firestoreService = new FirestoreService();