import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Test, TestType, CEFRLevel, Word, UserAnswer } from '../../types/database';
import { databaseService } from '../../services/storage/database';

interface TestQuestion {
  word: Word;
  options: string[];
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
  responseTime?: number;
}

interface ActiveTest {
  id?: number;
  type: TestType;
  level: CEFRLevel;
  questions: TestQuestion[];
  currentQuestionIndex: number;
  startTime: number;
  answers: UserAnswer[];
  isCompleted: boolean;
}

interface TestsState {
  tests: Test[];
  activeTest: ActiveTest | null;
  isLoading: boolean;
  error: string | null;
  testResults: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    duration: number;
    suggestedLevel?: CEFRLevel;
  } | null;
}

const initialState: TestsState = {
  tests: [],
  activeTest: null,
  isLoading: false,
  error: null,
  testResults: null,
};

// Async thunks
export const loadUserTests = createAsyncThunk(
  'tests/loadUserTests',
  async (userId: number, { rejectWithValue }) => {
    try {
      const tests = await databaseService.getUserTests(userId, 20);
      return tests;
    } catch (error) {
      return rejectWithValue('Testler yüklenirken hata oluştu');
    }
  }
);

export const startTest = createAsyncThunk(
  'tests/startTest',
  async ({ type, level, questionCount = 20 }: { type: TestType; level: CEFRLevel; questionCount?: number }, { rejectWithValue }) => {
    try {
      // Get random words for the test
      const words = await databaseService.getRandomWordsByLevel(level, questionCount);
      
      if (words.length < questionCount) {
        return rejectWithValue(`Bu seviye için yeterli kelime bulunamadı (${words.length}/${questionCount})`);
      }

      // Create test questions with multiple choice options
      const questions: TestQuestion[] = [];
      
      for (const word of words) {
        // Get random wrong answers from the same level
        const wrongAnswers = await databaseService.getRandomWordsByLevel(level, 10);
        const wrongOptions = wrongAnswers
          .filter(w => w.id !== word.id)
          .slice(0, 3)
          .map(w => w.definition_tr);
        
        // Create options array with correct answer
        const options = [word.definition_tr, ...wrongOptions].sort(() => Math.random() - 0.5);
        
        questions.push({
          word,
          options,
          correctAnswer: word.definition_tr,
        });
      }

      const activeTest: ActiveTest = {
        type,
        level,
        questions,
        currentQuestionIndex: 0,
        startTime: Date.now(),
        answers: [],
        isCompleted: false,
      };

      return activeTest;
    } catch (error) {
      return rejectWithValue('Test başlatılırken hata oluştu');
    }
  }
);

export const submitAnswer = createAsyncThunk(
  'tests/submitAnswer',
  async ({ answer, responseTime }: { answer: string; responseTime: number }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { tests: TestsState };
      const activeTest = state.tests.activeTest;
      
      if (!activeTest) {
        return rejectWithValue('Aktif test bulunamadı');
      }

      const currentQuestion = activeTest.questions[activeTest.currentQuestionIndex];
      const isCorrect = answer === currentQuestion.correctAnswer;

      return {
        answer,
        isCorrect,
        responseTime,
        questionIndex: activeTest.currentQuestionIndex,
      };
    } catch (error) {
      return rejectWithValue('Cevap gönderilirken hata oluştu');
    }
  }
);

export const completeTest = createAsyncThunk(
  'tests/completeTest',
  async (userId: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { tests: TestsState };
      const activeTest = state.tests.activeTest;
      
      if (!activeTest) {
        return rejectWithValue('Aktif test bulunamadı');
      }

      const correctAnswers = activeTest.answers.filter(a => a.is_correct).length;
      const totalQuestions = activeTest.questions.length;
      const scorePercentage = (correctAnswers / totalQuestions) * 100;
      const duration = Math.floor((Date.now() - activeTest.startTime) / 1000);

      // Save test to database
      const testId = await databaseService.createTest({
        user_id: userId,
        test_type: activeTest.type,
        cefr_level: activeTest.level,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        score_percentage: scorePercentage,
        duration_seconds: duration,
      });

      // Calculate suggested level for level assessment tests
      let suggestedLevel: CEFRLevel | undefined;
      if (activeTest.type === 'level_assessment') {
        suggestedLevel = calculateSuggestedLevel(scorePercentage, activeTest.level);
      }

      return {
        testId,
        score: scorePercentage,
        totalQuestions,
        correctAnswers,
        duration,
        suggestedLevel,
      };
    } catch (error) {
      return rejectWithValue('Test tamamlanırken hata oluştu');
    }
  }
);

// Helper function to calculate suggested level
function calculateSuggestedLevel(scorePercentage: number, currentLevel: CEFRLevel): CEFRLevel {
  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const currentIndex = levels.indexOf(currentLevel);
  
  if (scorePercentage >= 80) {
    // High score - suggest next level or stay at current if already at max
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : currentLevel;
  } else if (scorePercentage >= 60) {
    // Medium score - stay at current level
    return currentLevel;
  } else {
    // Low score - suggest previous level or stay at current if already at min
    return currentIndex > 0 ? levels[currentIndex - 1] : currentLevel;
  }
}

const testsSlice = createSlice({
  name: 'tests',
  initialState,
  reducers: {
    nextQuestion: (state) => {
      if (state.activeTest && state.activeTest.currentQuestionIndex < state.activeTest.questions.length - 1) {
        state.activeTest.currentQuestionIndex += 1;
      }
    },
    resetTest: (state) => {
      state.activeTest = null;
      state.testResults = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearTestResults: (state) => {
      state.testResults = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load user tests
      .addCase(loadUserTests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUserTests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tests = action.payload;
        state.error = null;
      })
      .addCase(loadUserTests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Start test
      .addCase(startTest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startTest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeTest = action.payload;
        state.testResults = null;
        state.error = null;
      })
      .addCase(startTest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Submit answer
      .addCase(submitAnswer.fulfilled, (state, action) => {
        if (state.activeTest) {
          const { answer, isCorrect, responseTime, questionIndex } = action.payload;
          
          // Update current question
          state.activeTest.questions[questionIndex].userAnswer = answer;
          state.activeTest.questions[questionIndex].isCorrect = isCorrect;
          state.activeTest.questions[questionIndex].responseTime = responseTime;
          
          // Add to answers array
          const currentQuestion = state.activeTest.questions[questionIndex];
          state.activeTest.answers.push({
            id: 0, // Will be set when saved to database
            test_id: 0, // Will be set when test is completed
            word_id: currentQuestion.word.id,
            user_answer: answer,
            correct_answer: currentQuestion.correctAnswer,
            is_correct: isCorrect,
            response_time_ms: responseTime,
            created_at: new Date().toISOString(),
          });
        }
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Complete test
      .addCase(completeTest.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(completeTest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.testResults = action.payload;
        if (state.activeTest) {
          state.activeTest.isCompleted = true;
          state.activeTest.id = action.payload.testId;
        }
        state.error = null;
      })
      .addCase(completeTest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { nextQuestion, resetTest, clearError, clearTestResults } = testsSlice.actions;
export default testsSlice.reducer;