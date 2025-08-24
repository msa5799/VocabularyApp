import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Word, CEFRLevel, DailyWord } from '../../types/database';
import { databaseService } from '../../services/storage/database';

interface WordsState {
  words: Word[];
  dailyWords: (DailyWord & Word)[];
  currentWord: Word | null;
  isLoading: boolean;
  error: string | null;
  currentLevel: CEFRLevel;
}

const initialState: WordsState = {
  words: [],
  dailyWords: [],
  currentWord: null,
  isLoading: false,
  error: null,
  currentLevel: 'A1',
};

// Async thunks
export const loadWordsByLevel = createAsyncThunk(
  'words/loadWordsByLevel',
  async (level: CEFRLevel, { rejectWithValue }) => {
    try {
      const words = await databaseService.getWordsByLevel(level, 100);
      return { words, level };
    } catch (error) {
      return rejectWithValue('Kelimeler yüklenirken hata oluştu');
    }
  }
);

export const loadDailyWords = createAsyncThunk(
  'words/loadDailyWords',
  async ({ userId, date }: { userId: number; date: string }, { rejectWithValue }) => {
    try {
      const dailyWords = await databaseService.getDailyWords(userId, date);
      return dailyWords;
    } catch (error) {
      return rejectWithValue('Günlük kelimeler yüklenirken hata oluştu');
    }
  }
);

export const generateDailyWords = createAsyncThunk(
  'words/generateDailyWords',
  async ({ userId, level, date, count = 10 }: { userId: number; level: CEFRLevel; date: string; count?: number }, { rejectWithValue }) => {
    try {
      // Get random words for the user's level
      const randomWords = await databaseService.getRandomWordsByLevel(level, count);
      
      if (randomWords.length === 0) {
        return rejectWithValue('Bu seviye için kelime bulunamadı');
      }

      // Set daily words for the user
      const wordIds = randomWords.map(word => word.id);
      await databaseService.setDailyWords(userId, wordIds, date);
      
      // Get the daily words with full data
      const dailyWords = await databaseService.getDailyWords(userId, date);
      return dailyWords;
    } catch (error) {
      return rejectWithValue('Günlük kelimeler oluşturulurken hata oluştu');
    }
  }
);

export const markDailyWordCompleted = createAsyncThunk(
  'words/markDailyWordCompleted',
  async ({ userId, wordId, date }: { userId: number; wordId: number; date: string }, { rejectWithValue }) => {
    try {
      await databaseService.markDailyWordCompleted(userId, wordId, date);
      return wordId;
    } catch (error) {
      return rejectWithValue('Kelime tamamlanırken hata oluştu');
    }
  }
);

export const getRandomWordsForTest = createAsyncThunk(
  'words/getRandomWordsForTest',
  async ({ level, count }: { level: CEFRLevel; count: number }, { rejectWithValue }) => {
    try {
      const words = await databaseService.getRandomWordsByLevel(level, count);
      return words;
    } catch (error) {
      return rejectWithValue('Test kelimeleri yüklenirken hata oluştu');
    }
  }
);

const wordsSlice = createSlice({
  name: 'words',
  initialState,
  reducers: {
    setCurrentWord: (state, action: PayloadAction<Word | null>) => {
      state.currentWord = action.payload;
    },
    setCurrentLevel: (state, action: PayloadAction<CEFRLevel>) => {
      state.currentLevel = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearWords: (state) => {
      state.words = [];
      state.currentWord = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load words by level
      .addCase(loadWordsByLevel.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadWordsByLevel.fulfilled, (state, action) => {
        state.isLoading = false;
        state.words = action.payload.words;
        state.currentLevel = action.payload.level;
        state.error = null;
      })
      .addCase(loadWordsByLevel.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Load daily words
      .addCase(loadDailyWords.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadDailyWords.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dailyWords = action.payload;
        state.error = null;
      })
      .addCase(loadDailyWords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Generate daily words
      .addCase(generateDailyWords.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateDailyWords.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dailyWords = action.payload;
        state.error = null;
      })
      .addCase(generateDailyWords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Mark daily word completed
      .addCase(markDailyWordCompleted.fulfilled, (state, action) => {
        const wordId = action.payload;
        const wordIndex = state.dailyWords.findIndex(word => word.id === wordId);
        if (wordIndex !== -1) {
          state.dailyWords[wordIndex].is_completed = true;
        }
      })
      .addCase(markDailyWordCompleted.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Get random words for test
      .addCase(getRandomWordsForTest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getRandomWordsForTest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.words = action.payload;
        state.error = null;
      })
      .addCase(getRandomWordsForTest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentWord, setCurrentLevel, clearError, clearWords } = wordsSlice.actions;
export default wordsSlice.reducer;