import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserProgress, WordStatus } from '../../types/database';
import { databaseService } from '../../services/storage/database';

interface ProgressStats {
  totalWords: number;
  learningWords: number;
  knownWords: number;
  masteredWords: number;
  difficultWords: number;
  accuracyRate: number;
  streakDays: number;
  totalStudyTime: number;
}

interface ProgressState {
  userProgress: UserProgress[];
  stats: ProgressStats;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: ProgressState = {
  userProgress: [],
  stats: {
    totalWords: 0,
    learningWords: 0,
    knownWords: 0,
    masteredWords: 0,
    difficultWords: 0,
    accuracyRate: 0,
    streakDays: 0,
    totalStudyTime: 0,
  },
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const loadUserProgress = createAsyncThunk(
  'progress/loadUserProgress',
  async (userId: number, { rejectWithValue }) => {
    try {
      const progress = await databaseService.getUserProgress(userId);
      return progress;
    } catch (error) {
      return rejectWithValue('İlerleme verileri yüklenirken hata oluştu');
    }
  }
);

export const updateWordProgress = createAsyncThunk(
  'progress/updateWordProgress',
  async ({ userId, wordId, isCorrect }: { userId: number; wordId: number; isCorrect: boolean }, { rejectWithValue }) => {
    try {
      await databaseService.updateWordProgress(userId, wordId, isCorrect);
      
      // Get updated progress for this word
      const allProgress = await databaseService.getUserProgress(userId);
      const wordProgress = allProgress.find(p => p.word_id === wordId);
      
      return { wordProgress, isCorrect };
    } catch (error) {
      return rejectWithValue('İlerleme güncellenirken hata oluştu');
    }
  }
);

export const calculateProgressStats = createAsyncThunk(
  'progress/calculateProgressStats',
  async (userId: number, { rejectWithValue }) => {
    try {
      const progress = await databaseService.getUserProgress(userId);
      const tests = await databaseService.getUserTests(userId, 100);
      
      // Calculate basic stats
      const totalWords = progress.length;
      const learningWords = progress.filter(p => p.status === 'learning').length;
      const knownWords = progress.filter(p => p.status === 'known').length;
      const masteredWords = progress.filter(p => p.status === 'mastered').length;
      const difficultWords = progress.filter(p => p.status === 'difficult').length;
      
      // Calculate accuracy rate
      const totalAttempts = progress.reduce((sum, p) => sum + p.correct_count + p.incorrect_count, 0);
      const totalCorrect = progress.reduce((sum, p) => sum + p.correct_count, 0);
      const accuracyRate = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
      
      // Calculate streak days (simplified - based on test dates)
      let streakDays = 0;
      if (tests.length > 0) {
        const today = new Date();
        const testDates = tests.map(t => new Date(t.completed_at).toDateString());
        const uniqueDates = [...new Set(testDates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        
        for (let i = 0; i < uniqueDates.length; i++) {
          const testDate = new Date(uniqueDates[i]);
          const expectedDate = new Date(today);
          expectedDate.setDate(today.getDate() - i);
          
          if (testDate.toDateString() === expectedDate.toDateString()) {
            streakDays++;
          } else {
            break;
          }
        }
      }
      
      // Calculate total study time (sum of test durations)
      const totalStudyTime = tests.reduce((sum, t) => sum + t.duration_seconds, 0);
      
      const stats: ProgressStats = {
        totalWords,
        learningWords,
        knownWords,
        masteredWords,
        difficultWords,
        accuracyRate: Math.round(accuracyRate * 100) / 100,
        streakDays,
        totalStudyTime,
      };
      
      return stats;
    } catch (error) {
      return rejectWithValue('İstatistikler hesaplanırken hata oluştu');
    }
  }
);

export const getWordsForReview = createAsyncThunk(
  'progress/getWordsForReview',
  async (userId: number, { rejectWithValue }) => {
    try {
      const progress = await databaseService.getUserProgress(userId);
      const now = new Date();
      
      // Filter words that need review (next_review date has passed)
      const wordsForReview = progress.filter(p => {
        if (!p.next_review) return false;
        const reviewDate = new Date(p.next_review);
        return reviewDate <= now;
      });
      
      return wordsForReview;
    } catch (error) {
      return rejectWithValue('Tekrar edilecek kelimeler yüklenirken hata oluştu');
    }
  }
);

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetProgress: (state) => {
      state.userProgress = [];
      state.stats = initialState.stats;
      state.lastUpdated = null;
    },
    updateLocalProgress: (state, action: PayloadAction<{ wordId: number; status: WordStatus }>) => {
      const { wordId, status } = action.payload;
      const progressIndex = state.userProgress.findIndex(p => p.word_id === wordId);
      
      if (progressIndex !== -1) {
        state.userProgress[progressIndex].status = status;
        state.userProgress[progressIndex].updated_at = new Date().toISOString();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Load user progress
      .addCase(loadUserProgress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUserProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userProgress = action.payload;
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(loadUserProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update word progress
      .addCase(updateWordProgress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateWordProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        const { wordProgress } = action.payload;
        
        if (wordProgress) {
          const existingIndex = state.userProgress.findIndex(p => p.word_id === wordProgress.word_id);
          
          if (existingIndex !== -1) {
            state.userProgress[existingIndex] = wordProgress;
          } else {
            state.userProgress.push(wordProgress);
          }
        }
        
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(updateWordProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Calculate progress stats
      .addCase(calculateProgressStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(calculateProgressStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(calculateProgressStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get words for review
      .addCase(getWordsForReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getWordsForReview.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update the progress array with words that need review
        const reviewWords = action.payload;
        reviewWords.forEach(reviewWord => {
          const existingIndex = state.userProgress.findIndex(p => p.id === reviewWord.id);
          if (existingIndex !== -1) {
            state.userProgress[existingIndex] = reviewWord;
          }
        });
        state.error = null;
      })
      .addCase(getWordsForReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, resetProgress, updateLocalProgress } = progressSlice.actions;
export default progressSlice.reducer;